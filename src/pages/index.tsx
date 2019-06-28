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

const roundTo1000 = (value: number) => Math.round(value / 1000) * 1000

const IndexPage = () => {
  const [state, setState] = useLocalStorage("configuration", {
    livingExpenses: 0,
    companyNetWorth: 0,
    companyProfitEstimate: 0,
  })
  const initialDraftState = {
    ...mapValues(state, val => (val === 0 ? "" : val.toString())),
  }
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
  const disabled =
    state.livingExpenses === 0 &&
    state.companyNetWorth === 0 &&
    state.companyProfitEstimate === 0
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
      <header>
        <SEO title="Home" />
        <h1>Osinkoa vai palkkaa?</h1>
        <h2>Ja kuinka paljon?</h2>
        <p>
          Kannattaako yrityksestä nostaa palkkaa vai osinkoa ja minkä verran?{" "}
          <strong>Osinkoa vai palkkaa</strong> auttaa sinua löytämään oikean
          määrän palkkaa ja osinkoja suhteessa maksettavien verojen määrään.
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
              Yrityksen varallisuus tilikauden alussa
            </label>
            <div className="input">
              <input
                autoFocus={true}
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
              Ennuste yrityksen voitosta ilman palkkoja
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
      <section className="main">
        <article>
          <h2>Laskelmat</h2>
          <p>
            Pakollisiin elinkustannuksiisi suhtautettu veroedullisin vaihtoehto
          </p>
          <Card
            disabled={disabled}
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
              <span className="card__value">{mostExpensive.dividents} € </span>
              <span className="card__value-type">osinkoa</span>
              <br />
              <span className="card__value">{mostExpensive.salary} € </span>
              <span className="card__value-type">palkkaa</span>
            </Card>
          </div>
        </article>
        <aside>
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

      <footer>
        Palvelun laskemat luvut ovat kerättyyn aineistoon ja keskiarvioihin
        perustuvia suuntaa antavia arvioita. osinkoavaipalkkaa.fi ei ota
        vastuuta palvelun laskemista tiedoista eikä niiden oikeellisuudesta
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
