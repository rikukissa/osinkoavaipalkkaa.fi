import React, { PropsWithChildren, useRef, useState, useEffect } from "react"

import SEO from "../components/seo"
import "./index.css"
import ReactTooltip from "react-tooltip"
const range = (n: number) =>
  Array(n)
    .fill(null)
    .map((_, i) => i)

function PointWithTooltip({
  x,
  y,
  width,
}: {
  x: number
  y: number
  width: number
}) {
  const ref = useRef<SVGCircleElement>(null)

  const focusCircle = () => ReactTooltip.show(ref.current!)

  return (
    <>
      <circle
        data-tip="true"
        data-for="kikki"
        ref={ref}
        fill="#D68560"
        cx={x}
        cy={y}
        r="1"
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
  const TICKS = 20
  const WIDTH = 100
  const points = range(TICKS).map(i => [
    (WIDTH / TICKS) * (i + 1),
    Math.min(47, 40 - (i * 1 + (-5 + Math.random() * 10))),
  ])

  return (
    <div className="chart">
      <div className="svg-container">
        <svg
          viewBox={`0 0 ${WIDTH} 50`}
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
            d={`M0 50 ${points.map(([x, y]) => `L${x} ${y}`).join(" ")} V50Z`}
            fill="url(#paint0_linear)"
          />
          <path
            d={`M0 50 ${points.map(([x, y]) => `L${x} ${y}`).join(" ")}`}
            stroke="#D68560"
          />
          {points.map(([x, y], i) => (
            <PointWithTooltip
              key={i}
              x={x}
              y={y}
              width={WIDTH / points.length}
            />
          ))}
        </svg>
        <ReactTooltip id="kikki" effect="solid">
          <div className="tooltip">
            <strong className="tooltip__title">40 000 €</strong>
            <span>
              Veroprosentti <strong>23,9%</strong>
            </span>
          </div>
        </ReactTooltip>
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
