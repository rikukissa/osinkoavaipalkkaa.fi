import { getCapitalGainsTaxEuroAmount } from "./formulas"

test("Capital gains ", () => {
  expect(getCapitalGainsTaxEuroAmount(12_000, 150_000)).toEqual(900)
  expect(getCapitalGainsTaxEuroAmount(12_000, 12_000)).toEqual(2556)
  expect(getCapitalGainsTaxEuroAmount(200000, 10_000_000)).toEqual(26000)
  expect(getCapitalGainsTaxEuroAmount(9000, 100_000)).toEqual(825)
})
