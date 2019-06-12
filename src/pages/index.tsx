import React, { PropsWithChildren, useRef, useState, useEffect } from "react"

import SEO from "../components/seo"
import "./index.css"
import ReactTooltip from "react-tooltip"
const range = (n: number) =>
  Array(n)
    .fill(null)
    .map((_, i) => i)

function Chart({ label }: { label: string }) {
  const [chartLoaded, setChartLoaded] = useState(false)
  const points = range(10).map(i => [
    10 * (i + 1),
    50 - Math.random() * 20 - i * 2,
  ])
  const svg = useRef<SVGSVGElement>(null)

  useEffect(() => setChartLoaded(Boolean(svg.current)), [svg])

  return (
    <div className="chart">
      <ReactTooltip id="kikki" effect="solid">
        <div className="tooltip">
          <strong className="tooltip__title">40 000 €</strong>
          <span>
            Veroprosentti <strong>23,9%</strong>
          </span>
        </div>
      </ReactTooltip>
      <div className="svg-container">
        <svg
          ref={svg}
          viewBox="0 0 100 50"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path
            d={`M0 50 ${points.map(([x, y]) => `L${x} ${y}`).join(" ")} V50Z`}
            fill="url(#paint0_linear)"
          />
          <path
            d={`M0 50 ${points.map(([x, y]) => `L${x} ${y}`).join(" ")}`}
            stroke="#D68560"
          />
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
        </svg>
        {chartLoaded && (
          <div className="tooltip-overlay">
            <ReactTooltip id="kikki" effect="solid">
              <div className="tooltip">
                <strong className="tooltip__title">40 000 €</strong>
                <span>
                  Veroprosentti <strong>23,9%</strong>
                </span>
              </div>
            </ReactTooltip>
            {points.map(([x, y], i) => (
              <div
                data-tip="true"
                data-for="kikki"
                key={i.toString()}
                className="tooltip-area"
                data-offset={`{'top': -${(svg.current!.getBoundingClientRect()
                  .height /
                  50) *
                  y -
                  10}}`}
              />
            ))}
          </div>
        )}
      </div>
      <label>Palkkatulon vaikutus verotukseen</label>
    </div>
  )
}
function Heatmap() {
  return (
    <div className="heatmap">
      <table>
        <tbody>
          <tr>
            <th>40k</th>
            <td data-tip="true" data-for="happyFace"></td>
            <td data-tip="true" data-for="happyFace"></td>
            <td data-tip="true" data-for="happyFace"></td>
            <td data-tip="true" data-for="happyFace"></td>
            <td data-tip="true" data-for="happyFace"></td>
            <td data-tip="true" data-for="happyFace"></td>
            <td data-tip="true" data-for="happyFace"></td>
          </tr>
          <tr>
            <th>30k</th>
            <td data-tip="true" data-for="happyFace"></td>
            <td data-tip="true" data-for="happyFace"></td>
            <td data-tip="true" data-for="happyFace"></td>
            <td data-tip="true" data-for="happyFace"></td>
            <td data-tip="true" data-for="happyFace"></td>
            <td data-tip="true" data-for="happyFace"></td>
            <td data-tip="true" data-for="happyFace"></td>
          </tr>
          <tr>
            <th>15k</th>
            <td data-tip="true" data-for="happyFace"></td>
            <td data-tip="true" data-for="happyFace"></td>
            <td data-tip="true" data-for="happyFace"></td>
            <td data-tip="true" data-for="happyFace"></td>
            <td data-tip="true" data-for="happyFace"></td>
            <td data-tip="true" data-for="happyFace"></td>
            <td data-tip="true" data-for="happyFace"></td>
          </tr>
          <tr>
            <th>10k</th>
            <td className="heatmap-cell--high"></td>
            <td className="heatmap-cell--low"></td>
            <td className="heatmap-cell--ideal"></td>
            <td className="heatmap-cell--medium"></td>
            <td></td>
            <td></td>
            <td></td>
          </tr>
          <tr>
            <th>5k</th>
            <td></td>
            <td></td>
            <td></td>
            <td></td>
            <td></td>
            <td></td>
            <td></td>
          </tr>
          <tr>
            <th>1k</th>
            <td></td>
            <td></td>
            <td></td>
            <td></td>
            <td></td>
            <td></td>
            <td></td>
          </tr>
          <tr>
            <td></td>
            <th>1k</th>
            <th>5k</th>
            <th>10k</th>
            <th>15k</th>
            <th>30k</th>
            <th>40k</th>
            <th>50k</th>
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

const IndexPage = () => (
  <div>
    <SEO title="Home" />
    <ReactTooltip id="happyFace" effect="solid">
      <div className="tooltip">
        <strong className="tooltip__title">40 000 €</strong>
        <span>
          Veroprosentti <strong>23,9%</strong>
        </span>
      </div>
    </ReactTooltip>
    <h1>Osinkoa vai palkkaa?</h1>
    <h2>Ja kuinka paljon?</h2>
    <p>Kannattaako yrityksestä nostaa palkkaa vai osinkoa ja minkä verran?</p>
    <section>
      <form>
        <div className="form-item">
          <label htmlFor="minimum-income">Pakolliset elinkustannukset</label>
          <div className="input">
            <input type="tel" className="number-input" id="minimum-income" />
          </div>
        </div>

        <Chart label="Palkkatulon vaikutus verotukseen" />

        <div className="form-item">
          <label htmlFor="company-value">Yrityksen varallisuus</label>
          <div className="input">
            <input
              type="tel"
              className="number-input"
              placeholder="100 000"
              id="company-value"
            />
          </div>
        </div>

        <div className="form-item">
          <label htmlFor="profit-prediction">Yrityksen nettotulo ennuste</label>
          <div className="input">
            <input type="tel" className="number-input" id="profit-prediction" />
          </div>
        </div>
      </form>
    </section>

    <section>
      <h2>Palkan & osingon suhde verotukseen</h2>
      <p>
        Yrityksestä nostettu raha vaikuttaa maksettavien verojen määrään.
        Seuraavasta taulukosta näet verotuksellisesti edullisimman vaihtoehdon.
      </p>
      <Heatmap />
    </section>

    <section>
      <h2>Laskelmat</h2>
      <p>Pakollisiin elinkustannuksiisi suhtautettu veroedullisin vaihtoehto</p>
      <Card className="card--ideal" title="paras vaihtoehto">
        <span className="card__value">15 000€ </span>
        <span className="card__value-type">osinkoa</span>
        <br />
        <span className="card__value">15 000€ </span>
        <span className="card__value-type">palkkaa</span>
      </Card>
      <p>
        Alentamalla elinkustannuksiasi <strong>10 000 €</strong>, sinä
        säästäisit <strong>2546 €</strong> ja yrityksesti{" "}
        <strong>12 343 €</strong>.
      </p>
      <Card className="card--cheapest" title="edullisin vaihtoehto">
        <span className="card__value">15 000€ </span>
        <span className="card__value-type">osinkoa</span>
        <br />
        <span className="card__value">15 000€ </span>
        <span className="card__value-type">palkkaa</span>
      </Card>
      <Card className="card--worst" title="kallein vaihtoehto">
        <span className="card__value">15 000€ </span>
        <span className="card__value-type">osinkoa</span>
        <br />
        <span className="card__value">15 000€ </span>
        <span className="card__value-type">palkkaa</span>
      </Card>
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

export default IndexPage
