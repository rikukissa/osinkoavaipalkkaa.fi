import ReactTooltip from "react-tooltip"
import React, { PropsWithChildren, useRef, useState, useEffect } from "react"
import uniqBy from "lodash/uniqBy"
import mapValues from "lodash/mapValues"

import range from "lodash/range"
import classnames from "classnames"
import useLocalStorage from "react-use/lib/useLocalStorage"
import SEO from "../components/seo"
import { sendEvent } from "../tags"
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
  getCapitalGainsTaxEuroAmount,
  getIncomeTaxEuroAmount,
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
  const tooltip = useRef<ReactTooltip>(null)

  const points = INCOME_TAX.map(({ percentage }, i) => [
    (WIDTH / TICKS) * (i + 1),
    HEIGHT - percentage / 2,
  ])

  const hideTooltip = () => {
    if (tooltip.current) {
      ;(tooltip.current as any).globalHide()
    }
  }

  return (
    <div className="chart" onMouseLeave={hideTooltip}>
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
          ref={tooltip}
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
  disabled,
}: PropsWithChildren<{ title: string; className: string; disabled: boolean }>) {
  return (
    <div
      className={["card", className, disabled ? "card--disabled" : ""].join(
        " "
      )}
    >
      <h3 className="card__title">{title}</h3>

      {children}
    </div>
  )
}

const initialState = {
  livingExpenses: 0,
  companyNetWorth: 0,
  companyProfitEstimate: 0,
}

const roundTo1000 = (value: number) => Math.round(value / 1000) * 1000

const stateToDraftState = (state: typeof initialState) => ({
  ...mapValues(state, val => (val === 0 ? "" : val.toString())),
})

const IndexPage = () => {
  const [storedState, setStoredState] = useLocalStorage(
    "configuration",
    initialState
  )

  const [state, setState] = useState(initialState)

  const initialDraftState = stateToDraftState(initialState)
  const [draftState, setDraftState] = useState(initialDraftState)

  useEffect(() => {
    setState(storedState)
    setDraftState(stateToDraftState(storedState))
  }, [])

  const disabled =
    state.livingExpenses === 0 &&
    state.companyNetWorth === 0 &&
    state.companyProfitEstimate === 0

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

      if (isNaN(parsed) || parsed < 0) {
        return
      }
      newState[key] = parsed
    }
    sendEvent("key-values-configured")
    setState(newState as typeof state)
    setStoredState(newState as typeof state)
  }, [draftState])

  const brackets = range(100).map(i => i / 100)

  const permutations = permutate<number>(brackets, brackets).map(
    ([dividents, salary]) =>
      disabled
        ? [roundTo1000(100000 * dividents), roundTo1000(30000 * salary)]
        : [
            roundTo1000(state.companyNetWorth * dividents),
            roundTo1000(state.companyProfitEstimate * salary),
          ]
  )

  const unsortedScenarios = uniqBy(permutations, ([a, b]) => `${a}${b}`)
    .filter(([dividents, salary]) =>
      disabled
        ? true
        : salary <= state.companyProfitEstimate &&
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
        capitalGainsTax: getCapitalGainsTaxEuroAmount(dividents),
        incomeTax: getIncomeTaxEuroAmount(salary),
        netIncome: getNetIncome(salary, dividents),
        incomeTaxPercentage: getIncomeTaxBracket(salary).percentage,
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
  // console.log(scenarios)

  const [cheapest] = scenarios
  const mostExpensive = scenarios[scenarios.length - 1]
  const ideal =
    scenarios.filter(({ netIncome }) => netIncome >= state.livingExpenses)[0] ||
    cheapest

  const nextCheapest = scenarios[scenarios.indexOf(ideal) - 1]

  return (
    <div>
      <header>
        <SEO />
        <h1>Osinkoa vai palkkaa?</h1>
        <h2>Ja kuinka paljon?</h2>
        <p>
          Kannattaako yrityksestä nostaa palkkaa vai osinkoa ja minkä verran?{" "}
          <strong>Osinkoa vai palkkaa</strong> auttaa sinua löytämään oikean
          määrän palkkaa ja osinkoa suhteessa maksettavien verojen määrään.
          Palvelu on tarkoitettu pääasiassa oman osakeyhtiön omistaville
          freelancereille ja yksityisyrittäjille.
        </p>
      </header>
      <section className="main">
        <form className="details-form">
          <h2>Aloita syöttämällä perustiedot</h2>
          <p>
            Täytä seuraavat 3 kenttää. Näiden tietojen perusteella muodostamme
            laskemme kaikki mahdolliset skenaariot.
          </p>
          <div className="form-item">
            <label htmlFor="company-value">
              Yrityksen nettovarallisuus tilikauden alussa
            </label>
            <div className="input">
              <input
                autoFocus={
                  typeof window !== "undefined" && window.innerWidth > 800
                }
                type="text"
                value={draftState.companyNetWorth}
                onChange={e =>
                  setDraftState({
                    ...draftState,
                    companyNetWorth: e.target.value,
                  })
                }
                className="number-input"
                placeholder="10 000"
                id="company-value"
              />
            </div>
          </div>
          <div className="form-item">
            <label htmlFor="profit-prediction">
              Ennuste yrityksen voitosta ennen palkkakuluja
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
                placeholder="8000"
                id="profit-prediction"
              />
            </div>
          </div>
          <div className="form-item">
            {" "}
            <label htmlFor="minimum-income">Halutun nettotulon alaraja</label>
            <div className="input">
              <input
                type="text"
                value={draftState.livingExpenses}
                placeholder="5000"
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
            {/* <Chart ideal={ideal} label="Palkkatulon vaikutus verotukseen" /> */}
          </div>
        </form>
        <main>
          <h2>Palkan & osingon suhde verotukseen</h2>
          <p>
            Yrityksestä nostettu raha vaikuttaa maksettavien verojen määrään.
            Seuraavasta taulukosta näet verotuksellisesti edullisimman
            vaihtoehdon.
          </p>
          <Heatmap
            disabled={disabled}
            livingExpenses={state.livingExpenses}
            cheapest={cheapest}
            ideal={ideal}
            scenarios={scenarios}
          />
        </main>
      </section>
      <div className="calculations">
        <section>
          <article>
            <h2>Laskelmat</h2>
            <p>
              Seuraavassa sinulle sopivin vaihtoehto syöttämääsi nettotulon
              alarajaan suhteutettuna. Mukana vertailun vuoksi myös{" "}
              {ideal !== cheapest && "verotuksellisesti halvin, sekä"} kaikista
              kallein vaihtoehto.
            </p>
            <div className="cards">
              <Card
                disabled={disabled}
                className="card--ideal"
                title="sinulle paras vaihtoehto"
              >
                <span className="card__value">{ideal.dividents} € </span>
                <span className="card__value-type">osinkoa</span>
                <br />
                <span className="card__value">{ideal.salary} € </span>
                <span className="card__value-type">palkkaa</span>
              </Card>

              {(() => {
                if (scenarios.indexOf(ideal) < 1) {
                  return null
                }

                const personalTaxDifference =
                  ideal.personalTaxes - nextCheapest.personalTaxes
                const companyTaxDifference =
                  ideal.companyTaxes - nextCheapest.companyTaxes
                const totalTaxDifference = ideal.taxes - nextCheapest.taxes
                const ownText =
                  personalTaxDifference > 0 ? (
                    <>
                      säästäisi omassa verotuksessasi{" "}
                      <strong>
                        <Currency>{Math.abs(personalTaxDifference)}</Currency>
                      </strong>
                    </>
                  ) : (
                    <>
                      kasvattaisi omaa verotustasi{" "}
                      <strong>
                        <Currency>{Math.abs(personalTaxDifference)}</Currency>
                      </strong>
                    </>
                  )

                const companyText =
                  companyTaxDifference > 0 ? (
                    <>
                      säästäisi yrityksesi verotuksessa{" "}
                      <strong>
                        <Currency>{Math.abs(companyTaxDifference)}</Currency>
                      </strong>
                    </>
                  ) : (
                    <>
                      kasvattaisi yrityksesi verotusta{" "}
                      <strong>
                        <Currency>{Math.abs(companyTaxDifference)}</Currency>
                      </strong>
                    </>
                  )

                const conjunction =
                  personalTaxDifference > 0 && companyTaxDifference > 0
                    ? "ja"
                    : "mutta"

                return (
                  <p>
                    Seuraavaksi halvin vaihtoehto (
                    <strong>
                      <Currency>{nextCheapest.netIncome}</Currency>
                    </strong>{" "}
                    nettotuloa) {ownText}, {conjunction} {companyText}.
                    Kokonaisuudessaan rahaa säästyisi noin{" "}
                    <strong>
                      <Currency>{totalTaxDifference}</Currency>
                    </strong>
                    .
                  </p>
                )
              })()}
              {ideal !== cheapest && (
                <Card
                  disabled={disabled}
                  className="card--cheapest"
                  title="edullisin vaihtoehto"
                >
                  <span className="card__value">{cheapest.dividents} € </span>
                  <span className="card__value-type">osinkoa</span>
                  <br />
                  <span className="card__value">{cheapest.salary} € </span>
                  <span className="card__value-type">palkkaa</span>
                </Card>
              )}
              <Card
                disabled={disabled}
                className="card--worst"
                title="kallein vaihtoehto"
              >
                <span className="card__value">
                  {mostExpensive.dividents} €{" "}
                </span>
                <span className="card__value-type">osinkoa</span>
                <br />
                <span className="card__value">{mostExpensive.salary} € </span>
                <span className="card__value-type">palkkaa</span>
              </Card>
            </div>
          </article>
          <aside>
            <section>
              <table
                className={[
                  "reference-table",
                  disabled ? "reference-table--disabled" : "",
                ].join(" ")}
              >
                <thead>
                  <tr>
                    <th />
                    <th>Nettotulo</th>
                    <th>Palkkaa</th>
                    <th>Tulovero</th>
                    <th>Osinkoa</th>
                    <th>Pääomatulovero</th>

                    <th>Yhteisövero</th>

                    <th>Veroja yhteensä</th>
                  </tr>
                </thead>
                <tbody>
                  {[
                    ideal,
                    ...(nextCheapest ? [nextCheapest] : []),
                    cheapest,
                  ].map((scenario, i) => (
                    <tr
                      className={classnames({
                        cheapest: cheapest === scenario,
                        ideal: ideal === scenario,
                      })}
                      key={i}
                    >
                      <td>
                        {scenario === ideal ? (
                          <svg
                            xmlns="http://www.w3.org/2000/svg"
                            viewBox="0 0 246.989 246.989"
                          >
                            <path d="M246.038 83.955l-39.424-70.664a7.502 7.502 0 0 0-6.55-3.846H46.93a7.5 7.5 0 0 0-6.55 3.846L.951 83.955a7.502 7.502 0 0 0 .734 8.391l116.002 142.432c.037.046.08.085.118.13.12.141.244.278.375.41.015.015.028.033.043.048.034.033.069.064.104.096l.037.033a7.878 7.878 0 0 0 .61.518c.145.11.295.213.448.313.072.047.143.094.216.139.129.077.263.148.397.219.055.028.108.059.164.086l.152.074c.149.069.303.128.459.188.097.038.192.079.291.113.019.006.035.015.054.021l.021.005c.066.022.137.034.205.054.253.075.51.136.77.184.108.02.215.04.324.055.309.043.622.07.938.074.029 0 .058.007.088.007h.002c.03 0 .059-.007.088-.007.317-.004.63-.031.939-.074.108-.015.214-.035.321-.054.263-.048.522-.11.776-.186.065-.019.133-.031.198-.052.008-.003.016-.003.023-.006.02-.006.036-.015.055-.022.098-.033.191-.074.287-.11.156-.06.312-.12.462-.189.052-.024.104-.05.155-.075.053-.026.104-.056.155-.082.136-.071.271-.143.401-.221.074-.045.146-.093.22-.141a7.035 7.035 0 0 0 .643-.469c.144-.116.281-.237.414-.362.013-.013.027-.023.04-.035.03-.029.062-.056.092-.086l.049-.053c.134-.135.261-.276.383-.42.036-.042.076-.079.111-.122L245.304 92.346a7.502 7.502 0 0 0 .734-8.391zM138.3 24.446l21.242 55.664H87.457l21.249-55.664H138.3zm21.765 70.664l-36.563 110.967L86.935 95.11h73.13zm-88.923 0l32.524 98.699L23.282 95.11h47.86zm104.716 0h47.851l-80.37 98.696 32.519-98.696zm50.857-15h-51.118l-21.242-55.664h41.306l31.054 55.664zM51.333 24.446H92.65L71.402 80.11H20.274l31.059-55.664z" />
                          </svg>
                        ) : (
                          scenario === cheapest && (
                            <svg
                              xmlns="http://www.w3.org/2000/svg"
                              viewBox="0 0 212.755 212.755"
                            >
                              <path d="M106.377 0C47.721 0 0 47.721 0 106.377s47.721 106.377 106.377 106.377 106.377-47.721 106.377-106.377S165.034 0 106.377 0zm0 198.755C55.44 198.755 14 157.314 14 106.377S55.44 14 106.377 14s92.377 41.44 92.377 92.377-41.44 92.378-92.377 92.378z" />
                              <path d="M113.377 100.096V60.352a20.136 20.136 0 0 1 9.82 7.82 7 7 0 0 0 11.692-7.699 34.073 34.073 0 0 0-21.512-14.647v-11.12a7 7 0 1 0-14 0v11.099c-15.493 3.23-27.168 16.989-27.168 33.426s11.676 30.198 27.168 33.428v39.744a20.136 20.136 0 0 1-9.82-7.82 7 7 0 1 0-11.692 7.699 34.073 34.073 0 0 0 21.512 14.647v11.119a7 7 0 1 0 14 0V166.95c15.493-3.23 27.168-16.989 27.168-33.426s-11.675-30.198-27.168-33.428zM86.209 79.231c0-8.653 5.494-16.027 13.168-18.874v37.748c-7.674-2.847-13.168-10.221-13.168-18.874zm27.168 73.166v-37.748c7.674 2.847 13.168 10.221 13.168 18.874s-5.493 16.027-13.168 18.874z" />
                            </svg>
                          )
                        )}
                      </td>
                      <td>
                        <Currency>{scenario.netIncome}</Currency>
                      </td>
                      <td>
                        <Currency>{scenario.salary}</Currency>
                      </td>
                      <td>
                        <Currency>{scenario.incomeTax}</Currency>
                        <br />
                        <span className="reference-table__tax">
                          {scenario.incomeTaxPercentage}%
                        </span>
                      </td>
                      <td>
                        <Currency>{scenario.dividents}</Currency>
                      </td>
                      <td>
                        <Currency>{scenario.capitalGainsTax}</Currency>
                      </td>

                      <td>
                        <Currency>{scenario.companyTaxes}</Currency>
                      </td>
                      <td>
                        <Currency>{scenario.taxes}</Currency>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </section>
            <section>
              <h2>Lisätietoa?</h2>
              <p>
                Haluaisitko saada vieläkin tarkempaa tietoa eri vaihtoehdoista
                osakeyhtiön palkanmaksuun liittyen? Onko mielessäsi
                parannusehdotus tai kommentti palveluun liittyen?
                <a
                  className="btn"
                  href="https://forms.gle/xZovhsW5GDB3J8w39"
                  target="_blank"
                >
                  Lähetä palautetta
                </a>
              </p>
            </section>
          </aside>
        </section>
      </div>
      <footer>
        Palvelun laskemat luvut ovat kerättyyn aineistoon ja keskiarvioihin
        perustuvia suuntaa antavia arvioita. <br />
        osinkoavaipalkkaa.fi ei ota vastuuta palvelun laskemista tiedoista eikä
        niiden oikeellisuudesta. <br />
        Palvelun käyttäjä kantaa itse vastuun palvelun antamien tietojen
        hyödyntämisestä.
        <br />
        <br />
        Käyttäjien palveluun syöttämiä tietoja ei kerätä eikä tallenneta.
      </footer>
    </div>
  )
}

export default IndexPage
