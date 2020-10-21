import uniqBy from "lodash/uniqBy"
import range from "lodash/range"

import {
  getTotalTaxEuroAmount,
  getNetIncome,
  getPersonalTaxes,
  getCorporateTax,
  getIncomeTaxBracket,
  getCapitalGainsTaxEuroAmount,
  getIncomeTaxEuroAmount,
  companyTaxesFromDividents,
  splitDividentIntoTaxableClasses,
} from "./formulas"

const f = (a: any[], b: any[]) =>
  // @ts-ignore
  [].concat(...a.map((aItem) => b.map((bItem) => [].concat(aItem, bItem))))

export function permutate<T>(
  a: any[] | any[],
  b?: any[],
  ...c: any[][]
): T[][] {
  return b ? permutate(f(a, b), ...c) : a
}

export interface IScenario {
  dividents: number
  companyTaxesFromDividents: number
  salary: number
  netSalary: number
  netIncome: number
  taxes: number
  personalTaxes: number
  companyTaxes: number
  companyProfit: number
  incomeTax: number
  incomeTaxPercentage: number
  taxFromDividents: number
  grossIncome: number
}

export function sortByBest(scenarios: IScenario[]) {
  return [...scenarios].sort((a, b) => a.taxes - b.taxes)
}

function easeInExpo(x: number): number {
  return x === 0 ? 0 : Math.pow(2, 10 * x - 10)
}

const roundTo1000 = (value: number) => Math.round(value / 1000) * 1000

function toScenario(
  companyProfitEstimate: number,
  companyNetWorth: number,
  dividents: number,
  salary: number
) {
  const companyTaxes = getCorporateTax(companyProfitEstimate - salary)

  const totalSharesInCompany = companyNetWorth

  const [asCapitalGains, asWorkIncome] = splitDividentIntoTaxableClasses(
    dividents,
    totalSharesInCompany
  )

  const totalWorkIncome = salary + asWorkIncome

  const incomeTaxBracket = getIncomeTaxBracket(totalWorkIncome)

  return {
    salary,
    dividents,
    companyTaxes,
    companyTaxesFromDividents: companyTaxesFromDividents(dividents),
    incomeTax: getIncomeTaxEuroAmount(totalWorkIncome, incomeTaxBracket),
    grossIncome: salary + dividents,
    incomeTaxPercentage: incomeTaxBracket.percentage,
    netSalary: salary - getIncomeTaxEuroAmount(salary, incomeTaxBracket),
    taxes: getTotalTaxEuroAmount(
      totalWorkIncome,
      asCapitalGains,
      asWorkIncome,
      dividents,
      incomeTaxBracket
    ),
    personalTaxes: getPersonalTaxes(
      totalWorkIncome,
      asCapitalGains,
      incomeTaxBracket
    ),
    netIncome: getNetIncome(totalWorkIncome, asCapitalGains, incomeTaxBracket),
    companyProfit: companyProfitEstimate - salary,
    taxFromDividents:
      getCapitalGainsTaxEuroAmount(asCapitalGains) +
      getIncomeTaxEuroAmount(asWorkIncome, incomeTaxBracket),
  }
}

type Range = [number, number]

function getPermutations(
  companyProfitEstimate: number,
  companyNetWorth: number,
  [minDivident, maxDivident]: Range,
  [minSalary, maxSalary]: Range
) {
  const brackets = range(100).map((i) => easeInExpo(i / 100))

  const permutations = permutate<number>(brackets, brackets)
    .map(([divident, salary]) => [
      roundTo1000(minDivident + (maxDivident - minDivident) * divident),
      roundTo1000(minSalary + (maxSalary - minSalary) * salary),
    ])
    .filter(([dividents, salary]) => {
      return salary + dividents <= companyProfitEstimate + companyNetWorth
    })

  return uniqBy(permutations, ([a, b]) => `${a}${b}`)
}

function generateScenarios(
  companyProfitEstimate: number,
  companyNetWorth: number,
  [minDivident, maxDivident]: Range,
  [minSalary, maxSalary]: Range
) {
  const unsortedScenarios = getPermutations(
    companyProfitEstimate,
    companyNetWorth,
    [minDivident, maxDivident],
    [minSalary, maxSalary]
  )
    .filter(([dividents, salary]) => {
      return salary + dividents <= companyProfitEstimate + companyNetWorth
    })
    .map(([divident, salary]) =>
      toScenario(companyProfitEstimate, companyNetWorth, divident, salary)
    )

  return sortByBest(unsortedScenarios)
}

export function getIdealScenario(
  scenarios: IScenario[],
  livingExpenses: number
) {
  return scenarios.filter(({ netIncome }) => netIncome >= livingExpenses)[0]
}

export function getScenarios(
  companyProfitEstimate: number,
  companyNetWorth: number
): IScenario[] {
  const scenarios = generateScenarios(
    companyProfitEstimate,
    companyNetWorth,
    [0, companyNetWorth * 0.4],
    [0, companyProfitEstimate]
  )

  return scenarios
}
