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

/*
 * Splits divident amount into a part that's taxed as capital gains (first 8%)
 * and a part that's taxed as work income
 * https://www.veronmaksajat.fi/Sijoittaminen/Osinkojen-verotus/#bed8e2d5
 */
function splitDividentIntoTaxableClasses(
  dividents: number,
  totalSharesInCompany: number
) {
  const eightPercentagePart = totalSharesInCompany * 0.08
  const asCapitalGains = Math.min(eightPercentagePart, dividents)
  const asWorkIncome = Math.max(0, dividents - asCapitalGains)
  return [asCapitalGains, asWorkIncome] as const
}

/*
 * Meant for calculating the 8% of shares part only
 */
export function getCapitalGainsTaxEuroAmount(dividents: number) {
  const below150kPart = Math.min(dividents, 150000)
  const over150kPart = Math.max(0, dividents - 150000)

  const taxable = below150kPart * 0.25 + over150kPart * 0.85

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
  const [asCapitalGains, asWorkIncome] = splitDividentIntoTaxableClasses(
    capitalGains,
    totalSharesInCompany
  )

  return (
    getIncomeTaxEuroAmount(grossIncome + asWorkIncome) +
    getCapitalGainsTaxEuroAmount(asCapitalGains) +
    companyTaxesFromDividents(capitalGains)
  )
}
export function getNetIncome(
  grossIncome: number,
  capitalGains: number,
  totalSharesInCompany: number
) {
  const [asCapitalGains, asWorkIncome] = splitDividentIntoTaxableClasses(
    capitalGains,
    totalSharesInCompany
  )
  return (
    grossIncome -
    getIncomeTaxEuroAmount(grossIncome + asWorkIncome) +
    capitalGains -
    getCapitalGainsTaxEuroAmount(asCapitalGains)
  )
}

export function getPersonalTaxes(
  grossIncome: number,
  capitalGains: number,
  totalSharesInCompany: number
) {
  const [asCapitalGains, asWorkIncome] = splitDividentIntoTaxableClasses(
    capitalGains,
    totalSharesInCompany
  )
  return (
    getIncomeTaxEuroAmount(grossIncome + asWorkIncome) +
    getCapitalGainsTaxEuroAmount(asCapitalGains)
  )
}
