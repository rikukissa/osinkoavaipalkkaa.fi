import { getCapitalGainsTaxEuroAmount } from "./formulas"

test("Capital gains ", () => {
  expect(getCapitalGainsTaxEuroAmount(12_000)).toEqual(900)
  expect(getCapitalGainsTaxEuroAmount(200000)).toEqual(26000)
  expect(getCapitalGainsTaxEuroAmount(9000)).toEqual(675)
  expect(getCapitalGainsTaxEuroAmount(131000)).toEqual(9935)
})
