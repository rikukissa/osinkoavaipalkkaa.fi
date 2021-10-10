import { isValidState } from "./pages/index"
import { State } from "./state"

const KEY_MAPPING = {
  livingExpenses: "l",
  companyNetWorth: "n",
  companyProfitEstimate: "p",
}

const REVERSED_KEY_MAPPING = Object.fromEntries(
  Object.entries(KEY_MAPPING).map(([key, value]) => [value, key])
)

export function getStateFromQueryParams(): State | null {
  const urlSearchParams = new URLSearchParams(window.location.search)
  const newState: Partial<State> = {}

  for (const [key, value] of Array.from(urlSearchParams.entries())) {
    const parsed = parseInt(value, 10)

    if (isNaN(parsed) || parsed < 0) {
      return null
    }
    newState[REVERSED_KEY_MAPPING[key] as keyof typeof newState] = parsed
  }

  if (!isValidState(newState)) {
    return null
  }

  return newState
}
export function setQueryParams<T>(state: T) {
  const params = new URLSearchParams()
  Object.entries(state).forEach(([key, value]) =>
    params.set(KEY_MAPPING[key as keyof typeof KEY_MAPPING], value.toString())
  )
  window.history.replaceState(
    {},
    "",
    `${location.pathname}?${params.toString()}`
  )
}
