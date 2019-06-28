import ReactTooltip from "react-tooltip"
import React, { PropsWithChildren, useRef, useState, useEffect } from "react"
import uniqBy from "lodash/uniqBy"
import mapValues from "lodash/mapValues"

import range from "lodash/range"
import useLocalStorage from "react-use/lib/useLocalStorage"
import SEO from "../components/seo"
import { Currency } from "../components/Currency"
import { Heatmap } from "../components/Heatmap/Heatmap"
import { INCOME_TAX } from "../income-tax"
import {
  permutate,
  getTotalTaxEuroAmount,
  getNetIncome,
  getPersonalTaxes,
  getCorporateTax,
  getIncomeTaxBracket,
  IScenario,
  sortByBest,
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

function Chart({ label, ideal }: { label: string; ideal?: IScenario }) {
  const TICKS = INCOME_TAX.length
  const WIDTH = 100
  const HEIGHT = 50

  const points = INCOME_TAX.map(({ percentage }, i) => [
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
          {ideal && (
            <path
              stroke="rgba(50, 175, 181, 0.22)"
              strokeDasharray="1.5,1.5"
              strokeWidth="0.3"
              d={`M${points[INCOME_TAX.indexOf(getIncomeTaxBracket(ideal.salary))][0]} 0 l0 50`}
            />
          )}

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
      <label>{label}</label>
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
  const [state, setState] = useLocalStorage("configuration", {
    livingExpenses: 20000,
    companyNetWorth: 100000,
    companyProfitEstimate: 150000,
  })
  const initialDraftState = { ...mapValues(state, val => val.toString()) }
  const [draftState, setDraftState] = useState(initialDraftState)

  useEffect(() => {
    const newState: Partial<typeof state> = {}
    if (draftState === initialDraftState) {
      return
    }
    for (const key of Object.keys(draftState) as Array<
      keyof (typeof draftState)
    >) {
      const value = draftState[key]
      const parsed = parseInt(value, 10)
      if (isNaN(parsed)) {
        return
      }
      newState[key] = parsed
    }

    setState(newState as typeof state)
  }, [draftState])

  const brackets = range(100).map(i => i / 100)

  const permutations = permutate<number>(brackets, brackets).map(
    ([dividents, salary]) => [
      roundTo1000(state.companyNetWorth * dividents),
      roundTo1000(state.companyProfitEstimate * salary),
    ]
  )

  const unsortedScenarios = uniqBy(permutations, ([a, b]) => `${a}${b}`)
    .filter(
      ([dividents, salary]) =>
        salary <= state.companyProfitEstimate &&
        dividents <= state.companyNetWorth
    )
    .map(([dividents, salary]) => {
      const companyTaxes = getCorporateTax(state.companyProfitEstimate - salary)
      const companyNetWorth =
        state.companyNetWorth -
        dividents +
        (state.companyProfitEstimate - salary) +
        companyTaxes

      return {
        dividents,
        salary,
        netIncome: getNetIncome(salary, dividents),
        taxes: getTotalTaxEuroAmount(
          salary,
          dividents,
          state.companyProfitEstimate - salary
        ),
        personalTaxes: getPersonalTaxes(salary, dividents),
        companyTaxes,
        companyNetWorth,
        companyTaxPrediction: companyNetWorth * 0.25 * 0.3,
      }
    })
  const scenarios = sortByBest(unsortedScenarios)
  const [cheapest] = scenarios
  const mostExpensive = scenarios[scenarios.length - 1]
  const ideal =
    scenarios.filter(({ netIncome }) => netIncome >= state.livingExpenses)[0] ||
    cheapest

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

        <form className="details-form">
          <div className="form-item">
            <label htmlFor="company-value">Yrityksen varallisuus</label>
            <div className="input">
              <input
                type="text"
                value={draftState.companyNetWorth}
                onChange={e =>
                  setDraftState({
                    ...draftState,
                    companyNetWorth: e.target.value,
                  })
                }
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
                type="text"
                value={draftState.companyProfitEstimate}
                onChange={e =>
                  setDraftState({
                    ...draftState,
                    companyProfitEstimate: e.target.value,
                  })
                }
                className="number-input"
                id="profit-prediction"
              />
            </div>
          </div>
          <div className="form-item">
            <label htmlFor="minimum-income">Pakolliset elinkustannukset</label>
            <div className="input">
              <input
                type="text"
                value={draftState.livingExpenses}
                onChange={e =>
                  setDraftState({
                    ...draftState,
                    livingExpenses: e.target.value,
                  })
                }
                className="number-input"
                id="minimum-income"
              />
            </div>
          </div>

          <Chart ideal={ideal} label="Palkkatulon vaikutus verotukseen" />
        </form>
      </section>

      <section className="calculated">
        <article>
          <h2>Palkan & osingon suhde verotukseen</h2>
          <p>
            Yrityksestä nostettu raha vaikuttaa maksettavien verojen määrään.
            Seuraavasta taulukosta näet verotuksellisesti edullisimman
            vaihtoehdon.
          </p>

          <Heatmap
            livingExpenses={state.livingExpenses}
            cheapest={cheapest}
            ideal={ideal}
            scenarios={scenarios}
          />
        </article>

        <article>
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
        </article>
      </section>
      {/* <section>
        <h2>Skenaariot</h2>
        <table className="reference-table">
          <thead>
            <tr>
              <th>Osinkoa</th>
              <th>Palkkaa</th>
              <th>Yritykselle jäävä netto-omaisuus</th>
              <th>Yhteisövero</th>
              <th>Henkilökohtainen verotus</th>
              <th>Käteen jäävä osuus</th>
              <th>Veroja yhteensä</th>
              <th>Vero-olettama yritykselle jäävästä omaisuudesta</th>
            </tr>
          </thead>
          <tbody>
            {scenarios.map((scenario, i) => (
              <tr
                className={classnames({
                  cheapest: cheapest === scenario,
                  ideal: ideal === scenario,
                })}
                key={i}
              >
                <td>
                  <Currency>{scenario.dividents}</Currency>
                </td>
                <td>
                  <Currency>{scenario.salary}</Currency>
                </td>
                <td>
                  <Currency>{scenario.companyNetWorth}</Currency>
                </td>
                <td>
                  <Currency>{scenario.companyTaxes}</Currency>
                </td>
                <td>
                  <Currency>{scenario.personalTaxes}</Currency>
                </td>
                <td>
                  <Currency>{scenario.netIncome}</Currency>
                </td>
                <td>
                  <Currency>{scenario.taxes}</Currency>
                </td>
                <td>
                  <Currency>{scenario.companyTaxPrediction}</Currency>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </section> */}
      <section>
        <h2>Lisätietoa?</h2>
        <p>
          Osinkoavaipalkkaa.fi PRO tarjoaa sinulle avaimet vero-optimointiin
          halpaan 1000 € vuosihintaan. Mikäli opiskelijakorttisi on vielä
          voimassa, alennamme hinnan kuitenkin edulliseen 20 € hintaan
          kuukaudessa.
        </p>
      </section>

      <footer>
        osinkoavaipalkkaa.fi ei ota vastuuta palvelun laskemista tiedoista eikä
        niiden oikeellisuudesta. Palvelun laskemat luvut ovat kerättyyn
        aineistoon ja keskiarvioihin perustuvia arvioita. Palvelun käyttäjä
        kantaa itse vastuun palvelun antamien tietojen hyödyntämisestä.
        <br />
        <br />
        Käyttäjien palveluun syöttämiä tietoja ei kerätä eikä tallenneta.
      </footer>
    </div>
  )
}

export default IndexPage
