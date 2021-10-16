const puppeteer = require("puppeteer")
const _ = require("lodash")

const brackets = [
  { income: 14000 },
  { income: 15000 },
  { income: 16000 },
  { income: 17000 },
  { income: 18000 },
  { income: 19000 },
  { income: 20000 },
  { income: 21000 },
  { income: 22000 },
  { income: 23000 },
  { income: 24000 },
  { income: 25000 },
  { income: 26000 },
  { income: 27000 },
  { income: 28000 },
  { income: 29000 },
  { income: 30000 },
  { income: 31000 },
  { income: 32000 },
  { income: 33000 },
  { income: 34000 },
  { income: 35000 },
  { income: 36000 },
  { income: 37000 },
  { income: 38000 },
  { income: 39000 },
  { income: 40000 },
  { income: 41000 },
  { income: 42000 },
  { income: 43000 },
  { income: 44000 },
  { income: 45000 },
  { income: 46000 },
  { income: 47000 },
  { income: 48000 },
  { income: 49000 },
  { income: 50000 },
  { income: 51000 },
  { income: 52000 },
  { income: 53000 },
  { income: 54000 },
  { income: 55000 },
  { income: 56000 },
  { income: 57000 },
  { income: 58000 },
  { income: 59000 },
  { income: 60000 },
  { income: 61000 },
  { income: 62000 },
  { income: 63000 },
  { income: 64000 },
  { income: 65000 },
  { income: 66000 },
  { income: 67000 },
  { income: 68000 },
  { income: 69000 },
  { income: 70000 },
  { income: 71000 },
  { income: 72000 },
  { income: 73000 },
  { income: 74000 },
  { income: 75000 },
  { income: 76000 },
  { income: 77000 },
  { income: 78000 },
  { income: 79000 },
  { income: 80000 },
  { income: 81000 },
  { income: 82000 },
  { income: 83000 },
  { income: 84000 },
  { income: 85000 },
  { income: 86000 },
  { income: 87000 },
  { income: 88000 },
  { income: 89000 },
  { income: 90000 },
  { income: 91000 },
  { income: 92000 },
  { income: 93000 },
  { income: 94000 },
  { income: 95000 },
  { income: 96000 },
  { income: 97000 },
  { income: 98000 },
  { income: 99000 },
  { income: 100000 },
  { income: 101000 },
  { income: 102000 },
  { income: 103000 },
  { income: 104000 },
  { income: 105000 },
  { income: 106000 },
  { income: 107000 },
  { income: 108000 },
  { income: 109000 },
  { income: 110000 },
  { income: 111000 },
  { income: 112000 },
  { income: 113000 },
  { income: 114000 },
  { income: 115000 },
  { income: 116000 },
  { income: 117000 },
  { income: 118000 },
  { income: 119000 },
  { income: 120000 },
  { income: 121000 },
  { income: 122000 },
  { income: 123000 },
  { income: 124000 },
  { income: 125000 },
  { income: 126000 },
  { income: 127000 },
  { income: 128000 },
  { income: 129000 },
  { income: 130000 },
  { income: 131000 },
  { income: 132000 },
  { income: 133000 },
  { income: 134000 },
  { income: 135000 },
  { income: 136000 },
  { income: 137000 },
  { income: 138000 },
  { income: 139000 },
  { income: 140000 },
  { income: 141000 },
  { income: 142000 },
  { income: 143000 },
  { income: 144000 },
  { income: 145000 },
  { income: 146000 },
  { income: 147000 },
  { income: 148000 },
  { income: 149000 },
  { income: 150000 },
  { income: 151000 },
  { income: 152000 },
  { income: 153000 },
  { income: 154000 },
  { income: 155000 },
  { income: 156000 },
  { income: 157000 },
  { income: 158000 },
  { income: 159000 },
  { income: 160000 },
  { income: 161000 },
  { income: 162000 },
  { income: 163000 },
  { income: 164000 },
  { income: 165000 },
  { income: 166000 },
  { income: 167000 },
  { income: 168000 },
  { income: 169000 },
  { income: 170000 },
  { income: 171000 },
  { income: 172000 },
  { income: 173000 },
  { income: 174000 },
  { income: 175000 },
  { income: 176000 },
  { income: 177000 },
  { income: 178000 },
  { income: 179000 },
  { income: 180000 },
  { income: 181000 },
  { income: 182000 },
  { income: 183000 },
  { income: 184000 },
  { income: 185000 },
  { income: 186000 },
  { income: 187000 },
  { income: 188000 },
  { income: 189000 },
  { income: 190000 },
  { income: 191000 },
  { income: 192000 },
  { income: 193000 },
  { income: 194000 },
  { income: 195000 },
  { income: 196000 },
  { income: 197000 },
  { income: 198000 },
  { income: 199000 },
  { income: 200000 },
]

;(async () => {
  const chunks = _.chunk(brackets, 4)
  for (chunk of chunks) {
    await Promise.all(
      chunk.map(async (bracket) => {
        let done = false
        let fails = 0
        while (!done) {
          const browser = await puppeteer.launch()
          const page = await browser.newPage()
          try {
            await page.goto(
              "https://www.vero.fi/henkiloasiakkaat/verokortti-ja-veroilmoitus/verokortti/veroprosenttilaskuri/"
            )
            await page.waitForSelector(".btn-action")
            await page.click(".btn-action")
            await page.waitFor(3000)
            await page.click('[aria-controls="ui-id-1"]')
            await page.waitFor(1000)
            await page.click("li#ui-id-185")

            await page.click('[aria-controls="ui-id-2"]')
            await page.waitFor(1000)
            // ui-id-315 - Ei kirkollisverovelvollinen
            // ui-id-316 Evlut
            await page.click("#ui-id-315")

            await page.click('[aria-controls="ui-id-3"]')
            await page.waitFor(1000)
            await page.click("#ui-id-350")
            await page.waitFor(1000)
            await page.click("#l-__NextStep")
            await page.waitFor(1000)
            await page.type("#l-y1", bracket.income.toString())
            await page.click("#l-__NextStep")
            await page.waitFor(1000)
            await page.click("#l-__NextStep")
            await page.waitFor(1000)
            const element = await page.$("#l-ie")

            const text = await page.evaluate(
              (element) => element.value,
              element
            )
            console.log(bracket.income, text)
            done = true
            await page.waitFor(1000)
            await browser.close()
          } catch (error) {
            fails++
            console.log("Fail", fails)
            if (fails > 3) {
              process.exit(1)
            }
            await page.waitFor(1000)
          }
        }
      })
    )
  }
})()
