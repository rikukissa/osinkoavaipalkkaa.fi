import ReactTooltip from "react-tooltip"
import React, { PropsWithChildren, useRef, useState } from "react"

import SEO from "../components/seo"
import { INCOME_TAX } from "../income-tax"
import {
  permutate,
  getTotalTaxEuroAmount,
  getNetIncome,
  getPersonalTaxes,
  getCorporateTax,
} from "../formulas"
import "./index.css"

function PointWithTooltip({
  x,
  y,
  width,
  id,
}: {
  id: number
  x: number
  y: number
  width: number
}) {
  const ref = useRef<SVGCircleElement>(null)

  const focusCircle = () => ReactTooltip.show(ref.current!)

  return (
    <>
      <circle
        data-tip={id}
        data-for="chart"
        ref={ref}
        fill="#D68560"
        cx={x}
        cy={y}
        r="0.01"
      />
      <rect
        onTouchStart={focusCircle}
        onMouseEnter={focusCircle}
        x={x - width / 2}
        y={0}
        width={width}
        height="50"
      />
    </>
  )
}

function Chart({ label }: { label: string }) {
  const TICKS = INCOME_TAX.length
  const WIDTH = 100
  const HEIGHT = 50

  const points = INCOME_TAX.map(({ income, percentage }, i) => [
    (WIDTH / TICKS) * (i + 1),
    HEIGHT - percentage / 2,
  ])

  return (
    <div className="chart">
      <div className="svg-container">
        <svg
          viewBox={`0 0 ${WIDTH} ${HEIGHT}`}
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <defs>
            <linearGradient
              id="paint0_linear"
              x1="124"
              y1="3"
              x2="124"
              y2="53.5"
              gradientUnits="userSpaceOnUse"
            >
              <stop stopColor="#F7D6C8" />
              <stop offset="1" stopColor="#fff" stopOpacity="0" />
            </linearGradient>
          </defs>
          <path
            d={`M0 ${HEIGHT} ${points
              .map(([x, y]) => `L${x} ${y}`)
              .join(" ")} V${HEIGHT}Z`}
            fill="url(#paint0_linear)"
          />
          <path
            d={`M0 ${HEIGHT} ${points.map(([x, y]) => `L${x} ${y}`).join(" ")}`}
            stroke="#D68560"
          />
          {points.map(([x, y], i) => (
            <PointWithTooltip
              key={i}
              x={x}
              y={y}
              width={WIDTH / points.length}
              id={INCOME_TAX[i].income}
            />
          ))}
        </svg>
        <ReactTooltip
          id="chart"
          effect="solid"
          getContent={id => {
            if (!id) {
              return
            }

            const bracket = INCOME_TAX.find(
              ({ income }) => income.toString() === id
            )!

            return (
              <div className="tooltip">
                <strong className="tooltip__title">
                  <Currency>{bracket.income}</Currency>
                  <br /> palkkaa
                </strong>
                <span>
                  Veroprosentti <strong>{bracket.percentage}%</strong>
                </span>
              </div>
            )
          }}
        />
      </div>
      <label>Palkkatulon vaikutus verotukseen</label>
    </div>
  )
}

function Currency(props: { children: number }) {
  return (
    <>
      {new Intl.NumberFormat("fi-FI", {
        style: "currency",
        currency: "EUR",

        minimumFractionDigits: 0,
        maximumFractionDigits: 0,
      }).format(props.children)}
    </>
  )
}

interface IScenario {
  dividents: number
  salary: number
  netIncome: number
  taxes: number
  personalTaxes: number
  companyTaxes: number
}

function Heatmap({
  livingExpenses,
  scenarios,
}: {
  livingExpenses: number
  scenarios: IScenario[]
}) {
  const top8Cheapest = scenarios.slice(0, 8)
  const top5Expensive = scenarios.slice(-5)
  const mediumTier = scenarios.slice(-15, -5)
  const [ideal] = scenarios.filter(
    ({ netIncome }) => netIncome >= livingExpenses
  )

  const groupedByDividents = scenarios.reduce(
    (groups, scenario) => {
      groups[scenario.dividents] = groups[scenario.dividents] || []
      groups[scenario.dividents].push(scenario)
      groups[scenario.dividents].sort((a, b) => a.salary - b.salary)
      return groups
    },
    {} as { [key: string]: IScenario[] }
  )

  const formatLabel = (label: number) =>
    label >= 1000 ? `${label / 1000}k` : label

  function getClassName(scenario: IScenario) {
    if (scenario === ideal) {
      return "heatmap-cell--ideal"
    }
    if (top8Cheapest.includes(scenario)) {
      return "heatmap-cell--low"
    }
    if (top5Expensive.includes(scenario)) {
      return "heatmap-cell--high"
    }
    if (mediumTier.includes(scenario)) {
      return "heatmap-cell--medium"
    }
  }
  return (
    <div className="heatmap">
      <ReactTooltip
        id="heatmap"
        effect="solid"
        getContent={id => {
          if (!id) {
            return
          }
          const [dividents, salary] = id.split("-")

          const scenario = groupedByDividents[dividents][parseInt(salary, 10)]

          return (
            <div className="tooltip">
              <strong className="tooltip__title">
                <Currency>{scenario.taxes}</Currency>
                <br />
                veroja
              </strong>
              <Currency>{scenario.salary}</Currency> palkkaa
              <br />
              <Currency>{scenario.dividents}</Currency> osinkoa
            </div>
          )
        }}
      />
      <table className="heatmap-data">
        <tbody>
          {Object.keys(groupedByDividents)
            .sort((a, b) => parseInt(b, 10) - parseInt(a, 10))
            .map(key => {
              const sces = groupedByDividents[key]
              return (
                <tr key={key}>
                  <th>{formatLabel(parseInt(key, 10))}</th>
                  {sces.map((scenario, i) => (
                    <td
                      key={key + scenario.salary}
                      data-tip={`${key}-${i}`}
                      data-for="heatmap"
                      className={getClassName(scenario)}
                    />
                  ))}
                </tr>
              )
            })}
          <tr>
            <td />
            {Object.values(groupedByDividents)[0].map(({ salary }) => (
              <th key={salary}>{formatLabel(salary)}</th>
            ))}
          </tr>
        </tbody>
      </table>
    </div>
  )
}
function Card({
  children,
  title,
  className,
}: PropsWithChildren<{ title: string; className: string }>) {
  return (
    <div className={["card", className].join(" ")}>
      <h3 className="card__title">{title}</h3>

      {children}
    </div>
  )
}

const roundTo1000 = (value: number) => Math.round(value / 1000) * 1000

const IndexPage = () => {
  const [state, setState] = useState({
    livingExpenses: 20000,
    companyNetWorth: 100000,
    companyProfitEstimate: 150000,
  })

  const brackets = [0, 0.01, 0.05, 0.1, 0.15, 0.3, 0.5]

  const scenarios = permutate<number>(brackets, brackets)
    .map(([dividents, salary]) => [
      roundTo1000(state.companyNetWorth * dividents),
      roundTo1000(state.companyProfitEstimate * salary),
    ])
    .filter(
      ([dividents, salary]) =>
        salary <= state.companyProfitEstimate &&
        dividents <= state.companyNetWorth
    )
    .map(([dividents, salary]) => ({
      dividents,
      salary,
      netIncome: getNetIncome(salary, dividents),
      taxes: getTotalTaxEuroAmount(
        salary,
        dividents,
        state.companyProfitEstimate - salary
      ),
      personalTaxes: getPersonalTaxes(salary, dividents),
      companyTaxes: getCorporateTax(state.companyProfitEstimate - salary),
    }))
    .sort((a, b) => a.taxes - b.taxes)
  const [cheapest] = scenarios
  const mostExpensive = scenarios[scenarios.length - 1]
  const [ideal] = scenarios.filter(
    ({ netIncome }) => netIncome >= state.livingExpenses
  )

  return (
    <div>
      <section>
        <SEO title="Home" />
        <h1>Osinkoa vai palkkaa?</h1>
        <h2>Ja kuinka paljon?</h2>
        <p>
          Kannattaako yrityksestä nostaa palkkaa vai osinkoa ja minkä verran?
        </p>
      </section>
      <section>
        <h2>Perustiedot</h2>
        <p>
          sd fölsdfk ösldfksö dlkfö lsdölf dsökf öldfsklö sdfklö klsdkölkfds
        </p>
        <form className="details-form">
          <div className="form-item">
            <label htmlFor="minimum-income">Pakolliset elinkustannukset</label>
            <div className="input">
              <input
                type="text"
                value={state.livingExpenses}
                className="number-input"
                id="minimum-income"
              />
            </div>
          </div>

          <Chart label="Palkkatulon vaikutus verotukseen" />

          <div className="form-item">
            <label htmlFor="company-value">Yrityksen varallisuus</label>
            <div className="input">
              <input
                value={state.companyNetWorth}
                type="text"
                className="number-input"
                placeholder="100 000"
                id="company-value"
              />
            </div>
          </div>

          <div className="form-item">
            <label htmlFor="profit-prediction">
              Yrityksen nettotulo ennuste
            </label>
            <div className="input">
              <input
                value={state.companyProfitEstimate}
                type="text"
                className="number-input"
                id="profit-prediction"
              />
            </div>
          </div>
        </form>
      </section>

      <section>
        <h2>Palkan & osingon suhde verotukseen</h2>
        <p>
          Yrityksestä nostettu raha vaikuttaa maksettavien verojen määrään.
          Seuraavasta taulukosta näet verotuksellisesti edullisimman
          vaihtoehdon.
        </p>
        <Heatmap livingExpenses={state.livingExpenses} scenarios={scenarios} />
      </section>

      <section>
        <h2>Laskelmat</h2>
        <p>
          Pakollisiin elinkustannuksiisi suhtautettu veroedullisin vaihtoehto
        </p>
        <Card
          className="card--ideal"
          title="paras vaihtoehto nykyisillä elinkustannuksillasi"
        >
          <span className="card__value">{ideal.dividents} € </span>
          <span className="card__value-type">osinkoa</span>
          <br />
          <span className="card__value">{ideal.salary} € </span>
          <span className="card__value-type">palkkaa</span>
        </Card>
        <p>
          Alentamalla elinkustannuksiasi{" "}
          <strong>{ideal.netIncome - cheapest.netIncome} €</strong>, sinä ja
          yrityksesi säästäisitte yhteensä{" "}
          <strong>
            {ideal.personalTaxes -
              cheapest.personalTaxes +
              (ideal.companyTaxes - cheapest.companyTaxes)}{" "}
            €
          </strong>
          .
        </p>
        <div className="cards">
          <Card className="card--cheapest" title="edullisin vaihtoehto">
            <span className="card__value">{cheapest.dividents} € </span>
            <span className="card__value-type">osinkoa</span>
            <br />
            <span className="card__value">{cheapest.salary} € </span>
            <span className="card__value-type">palkkaa</span>
          </Card>
          <Card className="card--worst" title="kallein vaihtoehto">
            <span className="card__value">{mostExpensive.dividents} € </span>
            <span className="card__value-type">osinkoa</span>
            <br />
            <span className="card__value">{mostExpensive.salary} € </span>
            <span className="card__value-type">palkkaa</span>
          </Card>
        </div>
      </section>
      <section>
        <h2>Lisätietoa?</h2>
        <p>
          Osinkoavaipalkkaa.fi PRO tarjoaa sinulle avaimet vero-optimointiin
          halpaan 1000 € vuosihintaan. Mikäli opiskelijakorttisi on vielä
          voimassa, alennamme hinnan kuitenkin edulliseen 20 € hintaan
          kuukaudessa.
        </p>
      </section>
    </div>
  )
}

export default IndexPage
