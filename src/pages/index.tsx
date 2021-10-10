import "./index.css"

import classnames from "classnames"
import i18Next from "i18next"
import LanguageDetector from "i18next-browser-languagedetector"
import mapValues from "lodash/mapValues"
import uniq from "lodash/uniq"
import React, { PropsWithChildren, useEffect, useState } from "react"
import {
  I18nextProvider,
  initReactI18next,
  Trans,
  useTranslation,
} from "react-i18next"
import useLocalStorage from "react-use/lib/useLocalStorage"

import { Currency } from "../components/Currency"
import { Heatmap } from "../components/Heatmap/Heatmap"
import SEO from "../components/seo"
import en from "../i18n/en.json"
import fi from "../i18n/fi.json"
import { getStateFromQueryParams, setQueryParams } from "../query-params"
import { getIdealScenario, getScenarios } from "../scenarios"
import { initialState, State } from "../state"
import { sendEvent } from "../tags"

i18Next
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    resources: {
      en: {
        translation: en,
      },
      fi: {
        translation: fi,
      },
    },
    fallbackLng: "en",
    interpolation: {
      escapeValue: false,
    },
  })

i18Next.languages = ["fi", "en"]

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

const stateToDraftState = (state: State) => ({
  ...mapValues(state, (val) => (val === 0 ? "" : val.toString())),
})

export function isValidState(state: Partial<State>): state is State {
  if (
    !(
      typeof state.companyNetWorth === "number" &&
      typeof state.companyProfitEstimate === "number" &&
      typeof state.livingExpenses === "number"
    )
  ) {
    return false
  }
  const enoughAssetsToGenerateScenarios =
    state.companyNetWorth + state.companyProfitEstimate + state.livingExpenses >
    2000
  return enoughAssetsToGenerateScenarios
}

const IndexPage = () => {
  const [storedState, setStoredState] = useLocalStorage(
    "configuration",
    initialState
  )

  const [state, setState] = useState(initialState)

  const initialDraftState = stateToDraftState(initialState)
  const [draftState, setDraftState] = useState(initialDraftState)

  useEffect(() => {
    const startingState = getStateFromQueryParams() || storedState
    setState(startingState)
    setDraftState(stateToDraftState(startingState))
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
      keyof typeof draftState
    >) {
      const value = draftState[key]
      const parsed = parseInt(value, 10)

      if (isNaN(parsed) || parsed < 0) {
        return
      }
      newState[key] = parsed
    }
    if (!isValidState(newState)) {
      return
    }
    sendEvent("key-values-configured")
    setState(newState as typeof state)
    setQueryParams(newState)
    setStoredState(newState as typeof state)
  }, [draftState])

  const scenarios = disabled
    ? getScenarios(30_000, 100_000)
    : getScenarios(state.companyProfitEstimate, state.companyNetWorth)

  const [cheapest] = scenarios
    .filter(({ netIncome }) => netIncome !== 0)
    .sort((a, b) => a.netIncome / a.taxes - b.netIncome / b.taxes)
    .reverse()
  const mostExpensive = scenarios[scenarios.length - 1]
  const ideal = getIdealScenario(scenarios, state.livingExpenses) || cheapest

  const nextCheapest = scenarios[scenarios.indexOf(ideal) - 1]
  const { t, i18n } = useTranslation()

  const toggleLanguage = () => {
    i18n.changeLanguage(i18n.language === "fi" ? "en" : "fi")
  }

  return (
    <div>
      <header className="header">
        <SEO />
        <div>
          <h1>{t("title")}</h1>
          <h2>{t("subtitle")}</h2>
          <p>
            <Trans i18nKey="description" />
          </p>
        </div>
        <div className="language-select">
          <button onClick={() => toggleLanguage()} className="language">
            {i18n.language === "fi" ? (
              <>
                🇬🇧 <span>In English</span>
              </>
            ) : (
              <>
                🇫🇮 <span>Suomeksi</span>
              </>
            )}
          </button>
        </div>
      </header>
      <section className="main">
        <form className="details-form">
          <h2>{t("start")}</h2>
          <p>{t("startHelp")}</p>
          <div className="form-item">
            <label htmlFor="company-value">{t("inputsNetFunds")}</label>
            <div className="input">
              <input
                autoFocus={
                  typeof window !== "undefined" && window.innerWidth > 800
                }
                type="text"
                value={draftState.companyNetWorth}
                onChange={(e) =>
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
              {t("inputsProfitPredition")}
            </label>
            <div className="input">
              <input
                type="text"
                value={draftState.companyProfitEstimate}
                onChange={(e) =>
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
            <label htmlFor="minimum-income">{t("inputMinimumIncome")}</label>
            <div className="input">
              <input
                type="text"
                value={draftState.livingExpenses}
                placeholder="5000"
                onChange={(e) =>
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
        </form>
        <main>
          <h2>{t("scenariosTitle")}</h2>
          <p>{t("scenariosDescription")}</p>
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
            <h2>{t("calculationsTitle")}</h2>
            <p>
              {ideal !== cheapest
                ? t("calculationsDescriptionIdealNotCheapest")
                : t("calculationsDescriptionIdealCheapest")}
            </p>
            <div className="cards">
              <Card
                disabled={disabled}
                className="card--ideal"
                title={t("cardBestOption")}
              >
                <span className="card__value">{ideal.dividents} € </span>
                <span className="card__value-type">{t("cardDivident")}</span>
                <br />
                <span className="card__value">{ideal.salary} € </span>
                <span className="card__value-type">{t("cardSalary")}</span>
              </Card>

              {(() => {
                if (scenarios.indexOf(ideal) < 1) {
                  return null
                }

                const personalTaxDifference =
                  ideal.personalTaxes - nextCheapest.personalTaxes
                const companyTaxDifference =
                  ideal.companyTaxesFromDividents -
                  nextCheapest.companyTaxesFromDividents
                const totalTaxDifference = ideal.taxes - nextCheapest.taxes
                const ownText =
                  personalTaxDifference > 0 ? (
                    <>
                      {t("wouldSaveInTaxes")}{" "}
                      <strong>
                        <Currency>{Math.abs(personalTaxDifference)}</Currency>
                      </strong>
                    </>
                  ) : (
                    <>
                      {t("wouldIncreaseTaxes")}{" "}
                      <strong>
                        <Currency>{Math.abs(personalTaxDifference)}</Currency>
                      </strong>
                    </>
                  )

                const companyText =
                  companyTaxDifference > 0 ? (
                    <>
                      {t("wouldSaveInDividentTax")}{" "}
                      <strong>
                        <Currency>{Math.abs(companyTaxDifference)}</Currency>
                      </strong>
                    </>
                  ) : (
                    <>
                      {t("wouldIncreaseDividentTax")}{" "}
                      <strong>
                        <Currency>{Math.abs(companyTaxDifference)}</Currency>
                      </strong>
                    </>
                  )

                const conjunction =
                  personalTaxDifference > 0 && companyTaxDifference > 0
                    ? t("and")
                    : t("but")

                return (
                  <p>
                    {t("nextCheapest")} (
                    <strong>
                      <Currency>{nextCheapest.netIncome}</Currency>
                    </strong>{" "}
                    {t("netIncome")}) {ownText}, {conjunction} {companyText}.{" "}
                    {t("inTotalYouWouldSave")}{" "}
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
                  title={t("cheapestOption")}
                >
                  <span className="card__value">{cheapest.dividents} € </span>
                  <span className="card__value-type">{t("cardDivident")}</span>
                  <br />
                  <span className="card__value">{cheapest.salary} € </span>
                  <span className="card__value-type">{t("cardSalary")}</span>
                </Card>
              )}
              <Card
                disabled={disabled}
                className="card--worst"
                title={t("mostExpensiveOption")}
              >
                <span className="card__value">
                  {mostExpensive.dividents} €{" "}
                </span>
                <span className="card__value-type">{t("cardDivident")}</span>
                <br />
                <span className="card__value">{mostExpensive.salary} € </span>
                <span className="card__value-type">{t("cardSalary")}</span>
              </Card>
            </div>
          </article>
          <aside>
            <section className="reference">
              <table
                className={[
                  "reference-table",
                  disabled ? "reference-table--disabled" : "",
                ].join(" ")}
              >
                <thead>
                  <tr>
                    <th />
                    <th>{t("tableNetIncome")}</th>
                    <th>{t("tableSalary")}</th>
                    <th>{t("tableIncomeTax")}</th>
                    <th>{t("tableDivident")}</th>
                    <th>{t("tableCapitalGainsTax")}</th>

                    <th>{t("tableCompanyTax")}</th>

                    <th>{t("tableTaxesInTotal")}</th>
                  </tr>
                </thead>
                <tbody>
                  {uniq([
                    ideal,
                    ...(nextCheapest ? [nextCheapest] : []),
                    cheapest,
                  ]).map((scenario, i) => (
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
                        <Currency>{scenario.taxFromDividents}</Currency>
                      </td>

                      <td>
                        <Currency>
                          {scenario.companyTaxesFromDividents}
                        </Currency>
                      </td>
                      <td>
                        <strong>
                          <Currency>{scenario.taxes}</Currency>
                        </strong>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              <small>{t("tableCorporateTaxDescription")}</small>
            </section>
            <section>
              <h2>{t("informationTitle")}</h2>
              <p>
                {t("informationDescription")}
                <a
                  className="btn"
                  href="https://github.com/rikukissa/osinkoavaipalkkaa.fi/issues"
                  target="_blank"
                >
                  {t("informationFeedbackButton")}
                </a>
              </p>
            </section>
          </aside>
        </section>
      </div>
      <footer>
        <Trans i18nKey="footer" />
      </footer>
    </div>
  )
}

export default () => (
  <I18nextProvider i18n={i18Next}>
    <IndexPage />
  </I18nextProvider>
)
