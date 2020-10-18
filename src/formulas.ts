import { INCOME_TAX, ITaxBracket } from "./income-tax"

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
  capitalGainsTax: number
  grossIncome: number
}
export function sortByBest(scenarios: IScenario[]) {
  return [...scenarios].sort((a, b) => a.taxes - b.taxes)
}

type TaxPercentage = number

export function getIncomeTaxBracket(grossIncome: number): ITaxBracket {
  return INCOME_TAX.find((bracket, i) =>
    INCOME_TAX[i + 1]
      ? grossIncome >= bracket.income && grossIncome < INCOME_TAX[i + 1].income
      : grossIncome >= bracket.income
  )!
}

/*
 * Ansiotulovero
 */

export function getIncomeTaxEuroAmount(grossIncome: number): TaxPercentage {
  return (getIncomeTaxBracket(grossIncome).percentage / 100) * grossIncome
}

/*
 * Pääomatulovero
 */

export function getCapitalGainsTaxEuroAmount(
  dividents: number,
  totalSharesInCompany: number
) {
  const eightPercentagePart = totalSharesInCompany * 0.08
  const below8pPart = Math.min(eightPercentagePart, dividents)

  const below150kPart = Math.min(below8pPart, 150000)
  const over150kPart = Math.max(0, below8pPart - 150000)

  const over8pPart = Math.max(0, dividents - below8pPart)

  const taxable = below150kPart * 0.25 + over150kPart * 0.85 + over8pPart * 0.75

  const over30kPart = Math.max(0, taxable - 30000)
  return (taxable - over30kPart) * 0.3 + over30kPart * 0.34
}

/*
 * Yhteisövero
 */

export function getCorporateTax(companyProfit: number) {
  return Math.max(0, companyProfit * 0.2)
}

/*
 * Osingosta maksettu yhteisövero
 */

export function companyTaxesFromDividents(dividents: number) {
  return getCorporateTax(dividents / 0.8)
}

/*
 * Kokonaisverotus
 */

export function getTotalTaxEuroAmount(
  grossIncome: number,
  capitalGains: number,
  totalSharesInCompany: number
) {
  return (
    getIncomeTaxEuroAmount(grossIncome) +
    getCapitalGainsTaxEuroAmount(capitalGains, totalSharesInCompany) +
    companyTaxesFromDividents(capitalGains)
  )
}
export function getNetIncome(
  grossIncome: number,
  capitalGains: number,
  totalSharesInCompany: number
) {
  return (
    grossIncome -
    getIncomeTaxEuroAmount(grossIncome) +
    capitalGains -
    getCapitalGainsTaxEuroAmount(capitalGains, totalSharesInCompany)
  )
}

export function getPersonalTaxes(
  grossIncome: number,
  capitalGains: number,
  totalSharesInCompany: number
) {
  return (
    getIncomeTaxEuroAmount(grossIncome) +
    getCapitalGainsTaxEuroAmount(capitalGains, totalSharesInCompany)
  )
}
