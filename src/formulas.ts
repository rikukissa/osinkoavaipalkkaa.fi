import { INCOME_TAX, ITaxBracket } from "./income-tax"

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

export function getIncomeTaxEuroAmount(
  grossIncome: number,
  taxBracket: ITaxBracket
): TaxPercentage {
  return (taxBracket.percentage / 100) * grossIncome
}

/*
 * Pääomatulovero
 */

/*
 * Splits divident amount into a part that's taxed as capital gains (first 8%)
 * and a part that's taxed as work income
 * https://www.veronmaksajat.fi/Sijoittaminen/Osinkojen-verotus/#bed8e2d5
 */
export function splitDividentIntoTaxableClasses(
  dividents: number,
  totalSharesInCompany: number
) {
  const eightPercentagePart = totalSharesInCompany * 0.08
  const asCapitalGains = Math.min(eightPercentagePart, dividents)
  const asWorkIncome = Math.max(0, dividents - asCapitalGains) * 0.75
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
  dividents: number,
  incomeTaxBracket: ITaxBracket
) {
  return (
    getIncomeTaxEuroAmount(grossIncome, incomeTaxBracket) +
    getCapitalGainsTaxEuroAmount(capitalGains) +
    companyTaxesFromDividents(dividents)
  )
}
export function getNetIncome(
  grossIncome: number,
  capitalGains: number,
  incomeTaxBracket: ITaxBracket
) {
  return (
    grossIncome -
    getIncomeTaxEuroAmount(grossIncome, incomeTaxBracket) +
    capitalGains -
    getCapitalGainsTaxEuroAmount(capitalGains)
  )
}

export function getPersonalTaxes(
  grossIncome: number,
  capitalGains: number,
  incomeTaxBracket: ITaxBracket
) {
  return (
    getIncomeTaxEuroAmount(grossIncome, incomeTaxBracket) +
    getCapitalGainsTaxEuroAmount(capitalGains)
  )
}
