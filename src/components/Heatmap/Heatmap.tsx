import ReactTooltip from "react-tooltip"
import React from "react"
import uniq from "lodash/uniq"
import values from "lodash/values"
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
      .map(percentage =>
        parseInt(
          yCategories[Math.floor((yCategories.length - 1) * percentage)],
          10
        )
      )
      .concat(scenariosToInclude.map(scenario => scenario.dividents))
  ).sort((a, b) => a - b)

  const xCategories = grid[yCategories[0]]
  const includedPositions = scenariosToInclude
    .map(scenario => findFromGrid(grid, scenario)!)
    .map(([y, x]) => x)

  const subXCategories = uniq(
    division
      .map(percentage => Math.floor((xCategories.length - 1) * percentage))
      .concat(includedPositions)
  ).sort((a, b) => a - b)

  const newGrid: IScenarioGrid = {}

  for (const category of subYCategories) {
    newGrid[category] = subXCategories.map(index => grid[category][index])
  }
  return newGrid
}

export function Heatmap({
  ideal,
  cheapest,
  scenarios: allScenarios,
}: {
  livingExpenses: number
  ideal: IScenario
  cheapest: IScenario
  scenarios: IScenario[]
}) {
  const groupedByDividents = allScenarios.reduce(
    (groups, scenario) => {
      groups[scenario.dividents] = groups[scenario.dividents] || []
      groups[scenario.dividents].push(scenario)
      groups[scenario.dividents].sort((a, b) => a.salary - b.salary)
      return groups
    },
    {} as IScenarioGrid
  )

  const grid = createSubgrid([0, 0.25, 0.5, 0.75, 1], groupedByDividents, [
    ideal,
    cheapest,
  ])

  const scenarios = values(grid).flat()

  const third = Math.floor(scenarios.length * (1 / 3))
  const cheapTier = scenarios.slice(0, third)
  const expensiveTier = scenarios.slice(-third)
  const mediumTier = scenarios.slice(third, third + third)

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
    <div className="heatmap">
      <ReactTooltip
        id="heatmap"
        effect="solid"
        getContent={id => {
          if (!id) {
            return
          }
          const [dividents, salary] = id.split("-")
          if (!grid[dividents]) {
            return
          }
          const scenario = grid[dividents][parseInt(salary, 10)]

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
          {Object.keys(grid)
            .sort((a, b) => parseInt(b, 10) - parseInt(a, 10))
            .map(key => {
              const sces = grid[key]
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
            {values(grid)[0].map(({ salary }) => (
              <th key={salary}>{formatLabel(salary)}</th>
            ))}
          </tr>
        </tbody>
      </table>
    </div>
  )
}
