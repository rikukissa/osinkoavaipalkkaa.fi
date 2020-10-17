import ReactTooltip from "react-tooltip"
import React, { useRef, useEffect, useState, useLayoutEffect } from "react"
import uniq from "lodash/uniq"
import range from "lodash/range"
import values from "lodash/values"
import flatten from "lodash/flatten"
import { IScenario } from "../../formulas"
import { Currency } from "../Currency"
import "./Heatmap.css"

interface IScenarioGrid {
  [key: string]: IScenario[]
}

function findFromGrid(
  grid: IScenarioGrid,
  scenario: IScenario
): [number, number] | null {
  const keys = Object.keys(grid)
  for (const key of keys) {
    for (const sce of grid[key]) {
      if (sce === scenario) {
        return [keys.indexOf(key), grid[key].indexOf(sce)]
      }
    }
  }
  return null
}

function createSubgrid(
  division: number[],
  grid: IScenarioGrid,
  scenariosToInclude: IScenario[]
) {
  const yCategories = Object.keys(grid)

  const subYCategories = uniq(
    division
      .map((percentage) =>
        parseInt(
          yCategories[Math.floor((yCategories.length - 1) * percentage)],
          10
        )
      )
      .concat(scenariosToInclude.map((scenario) => scenario.dividents))
  ).sort((a, b) => a - b)

  const xCategories = grid[yCategories[0]]
  const includedPositions = scenariosToInclude
    .map((scenario) => findFromGrid(grid, scenario)!)
    .map(([y, x]) => x)

  const subXCategories = uniq(
    division
      .map((percentage) => Math.floor((xCategories.length - 1) * percentage))
      .concat(includedPositions)
  ).sort((a, b) => a - b)

  const newGrid: IScenarioGrid = {}

  for (const category of subYCategories) {
    newGrid[category] = subXCategories.map((index) => grid[category][index])
  }
  return newGrid
}

function getGridWidth(grid: IScenarioGrid, screenSizeInColumns: number) {
  return Math.max(
    ...Object.values(grid).map((row) => row.length),
    screenSizeInColumns
  )
}

export function Heatmap(props: {
  disabled: boolean
  livingExpenses: number
  ideal: IScenario
  cheapest: IScenario
  scenarios: IScenario[]
}) {
  if (typeof window === "undefined") {
    return null
  }

  const { ideal, cheapest, disabled, scenarios: allScenarios } = props
  const container = useRef<HTMLDivElement>(null)

  const [size, setSize] = useState(0)
  const [forceRenderKey, setForceRenderKey] = useState(0)

  useEffect(() => {
    if (container.current) {
      setSize(Math.floor(container.current.parentElement!.offsetWidth / 50))
    }
  }, [container])

  useEffect(() => {
    ReactTooltip.rebuild()
  }, [size, allScenarios])

  useEffect(() => {
    setForceRenderKey(forceRenderKey + 1)
  }, [allScenarios])

  const groupedByDividents = allScenarios.reduce((groups, scenario) => {
    groups[scenario.dividents] = groups[scenario.dividents] || []
    groups[scenario.dividents].push(scenario)
    groups[scenario.dividents].sort((a, b) => a.salary - b.salary)
    return groups
  }, {} as IScenarioGrid)

  const grid = createSubgrid(
    range(size).map((i) => i * (1 / size)),
    groupedByDividents,
    [ideal, cheapest]
  )

  const scenarios = flatten(values(grid))

  const third = Math.floor(scenarios.length * (1 / 3))
  const cheapTier = scenarios.slice(0, third)

  const mediumTier = scenarios.slice(third, third + third)
  const expensiveTier = scenarios.slice(third + third, scenarios.length)

  const formatLabel = (label: number) =>
    label >= 1000 ? `${label / 1000}k` : label

  function getClassName(scenario: IScenario) {
    if (scenario === ideal) {
      return "heatmap-cell--ideal"
    }
    if (scenario === cheapest) {
      return "heatmap-cell--cheapest"
    }
    if (cheapTier.includes(scenario)) {
      return "heatmap-cell--low"
    }
    if (expensiveTier.includes(scenario)) {
      return "heatmap-cell--high"
    }
    if (mediumTier.includes(scenario)) {
      return "heatmap-cell--medium"
    }
  }

  return (
    <div ref={container} className="heatmap">
      <ReactTooltip
        id="heatmap"
        effect="solid"
        overridePosition={(
          { left, top },
          event,
          triggerElement,
          tooltipElement
        ) => {
          const tooltipWidth =
            tooltipElement?.getBoundingClientRect().width || 0
          const rightOverflow = Math.max(
            0,
            -1 * (window.innerWidth - (left + tooltipWidth))
          )

          return {
            top,
            left: Math.max(left - rightOverflow, 0),
          }
        }}
        getContent={(id) => {
          if (!id || disabled) {
            return
          }
          const [dividents, salary] = id.split("-")

          if (!grid[dividents]) {
            return
          }

          const scenario = grid[dividents][parseInt(salary, 10)]

          if (!scenario) {
            return
          }

          return (
            <div className="tooltip">
              <table>
                <thead>
                  <tr>
                    <th />
                    <th>Määrä</th>
                    <th>Vero</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td>Osinko</td>
                    <td>
                      <Currency>{scenario.dividents}</Currency>
                    </td>
                    <td>
                      <Currency>{scenario.capitalGainsTax}</Currency>
                    </td>
                  </tr>
                  <tr>
                    <td>Palkka ({scenario.incomeTaxPercentage}%)</td>
                    <td>
                      <Currency>{scenario.salary}</Currency>
                    </td>
                    <td>
                      <Currency>
                        {scenario.salary - scenario.netSalary}
                      </Currency>
                    </td>
                  </tr>
                  <tr>
                    <td>Yhteensä</td>
                    <td className="tooltip-profit">
                      <Currency>{scenario.netIncome}</Currency>
                    </td>
                    <td className="tooltip-tax">
                      <Currency>{scenario.personalTaxes}</Currency>
                    </td>
                  </tr>
                </tbody>
              </table>
              <p>
                Yrityksen tulos{" "}
                <strong>
                  <Currency>{scenario.companyProfit}</Currency>
                </strong>
                , josta
                <br /> yhteisövero{" "}
                <strong>
                  <Currency>{scenario.companyTaxes}</Currency>
                </strong>
              </p>
            </div>
          )
        }}
      />

      {size && (
        <div
          className="heatmap-data"
          style={{
            gridTemplateColumns: `1fr repeat(${getGridWidth(
              grid,
              size
            )}, 32px)`,
          }}
        >
          {Object.keys(grid)
            .sort((a, b) => parseInt(b, 10) - parseInt(a, 10))
            .map((key, row) => {
              const sces = grid[key]
              const rowWidth = Math.max(size, sces.length)

              return (
                <React.Fragment key={key}>
                  <label className="heatmap-label">
                    {formatLabel(parseInt(key, 10))}
                  </label>
                  {range(rowWidth).map((i) => {
                    const scenario = sces[i]
                    if (!scenario) {
                      return <div key={i} />
                    }

                    return (
                      <div
                        key={key + scenario.salary}
                        data-tip={`${key}-${i}`}
                        data-for="heatmap"
                        style={{
                          animationDuration: `${(i + row) * 100}ms`,
                        }}
                        className={[
                          "heatmap-cell",
                          getClassName(scenario),
                          disabled ? "heatmap-cell--disabled" : "",
                        ].join(" ")}
                      >
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
                      </div>
                    )
                  })}
                </React.Fragment>
              )
            })}

          <div />
          {values(grid)[0].map(({ salary }) => (
            <label className="heatmap-label" key={salary}>
              {formatLabel(salary)}
            </label>
          ))}
        </div>
      )}
    </div>
  )
}
