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
import first from "lodash/first"

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
  incomeTaxFromSalary: number
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
  ratio: number
}

export function sortByBest(scenarios: IScenario[]) {
  return [...scenarios].sort((a, b) => a.taxes - b.taxes)
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
  const taxes = getTotalTaxEuroAmount(
    totalWorkIncome,
    asCapitalGains,
    dividents,
    incomeTaxBracket
  )

  const netIncome = getNetIncome(
    totalWorkIncome,
    asCapitalGains,
    incomeTaxBracket
  )
  return {
    salary,
    dividents,
    companyTaxes,
    companyTaxesFromDividents: companyTaxesFromDividents(dividents),
    incomeTax: getIncomeTaxEuroAmount(totalWorkIncome, incomeTaxBracket),
    incomeTaxFromSalary: getIncomeTaxEuroAmount(salary, incomeTaxBracket),
    grossIncome: salary + dividents,
    incomeTaxPercentage: incomeTaxBracket.percentage,
    netSalary: salary - getIncomeTaxEuroAmount(salary, incomeTaxBracket),
    taxes,
    personalTaxes: getPersonalTaxes(
      totalWorkIncome,
      asCapitalGains,
      incomeTaxBracket
    ),
    netIncome,
    companyProfit: companyProfitEstimate - salary,
    taxFromDividents:
      getCapitalGainsTaxEuroAmount(asCapitalGains) +
      getIncomeTaxEuroAmount(asWorkIncome, incomeTaxBracket),
    ratio: taxes / netIncome || 0,
  }
}

type Range = [number, number]

function getPermutations(
  companyProfitEstimate: number,
  companyNetWorth: number,
  [minDivident, maxDivident]: Range,
  [minSalary, maxSalary]: Range
) {
  const dividentBrackets = range(Math.floor(companyNetWorth / 1000)).map(
    (val, i, arr) => i / arr.length
  )

  const salaryBrackets = range(Math.floor(companyProfitEstimate / 1000)).map(
    (val, i, arr) => i / arr.length
  )

  const permutations = permutate<number>(dividentBrackets, salaryBrackets)
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
  const proficientScenarios = scenarios.filter(
    ({ netIncome }) => netIncome >= livingExpenses
  )

  if (proficientScenarios.length === 0) {
    return first(scenarios.sort((a, b) => b.netIncome - a.netIncome))
  }

  return first(sortByBest(proficientScenarios))
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
