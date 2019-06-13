import { INCOME_TAX } from "./income-tax"

type TaxPercentage = number

/*
 * Ansiotulovero
 */

export function getIncomeTaxEuroAmount(grossIncome: number): TaxPercentage {
  return (
    (INCOME_TAX.find((bracket, i) =>
      INCOME_TAX[i + 1]
        ? grossIncome >= bracket.income &&
          grossIncome < INCOME_TAX[i + 1].income
        : grossIncome >= bracket.income
    ).percentage /
      100) *
    grossIncome
  )
}

/*
 * Pääomatulovero
 */

export function getCapitalGainsTaxEuroAmount(capitalGains: number) {
  const over30kPart = Math.max(0, capitalGains - 30000)
  return (capitalGains - over30kPart) * 0.3 + over30kPart * 0.34
}

/*
 * Yhteisövero
 */

export function getCorporateTax(companyProfit: number) {
  return companyProfit * 0.2
}

/*
 * Kokonaisverotus
 */

export function getTotalTaxEuroAmount(
  grossIncome: number,
  capitalGains: number,
  companyProfit: number
) {
  return (
    getIncomeTaxEuroAmount(grossIncome) +
    getCapitalGainsTaxEuroAmount(capitalGains) +
    getCorporateTax(companyProfit)
  )
}
