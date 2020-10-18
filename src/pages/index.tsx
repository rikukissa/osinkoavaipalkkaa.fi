import ReactTooltip from "react-tooltip"
import React, { PropsWithChildren, useRef, useState, useEffect } from "react"
import uniq from "lodash/uniq"
import uniqBy from "lodash/uniqBy"
import mapValues from "lodash/mapValues"
import i18n from "i18next"
import {
  useTranslation,
  initReactI18next,
  I18nextProvider,
  Trans,
} from "react-i18next"
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
  companyTaxesFromDividents,
} from "../formulas"
import "./index.css"

i18n.use(initReactI18next).init({
  resources: {
    en: {
      translation: {
        title: "Dividend or salary?",
        subtitle: "And how much?",
        description:
          "<strong>Osinkoa vai palkkaa</strong> helps you to find the optimal amount of salary and divident in relation to the amount of taxes payable. The service is intended mainly for freelancers and sole proprietors with their own limited company (Oy) in Finland.",
        start: "Start by entering basic information",
        startHelp:
          "Fill the 3 following fields. We calculate all possible scenarios based on this information.",
        inputsNetFunds: "Company's net assets at the beginning of fiscal year",
        inputsProfitPredition:
          "Estimate of company profit without salary expenses",
        inputMinimumIncome: "The amount of net income you need this year",
        scenariosTitle:
          "The relation between salary and divident to taxes payable",
        scenariosDescription:
          "The amount of salary and divident you pay have a direct relation to amount of taxes. This chart displays different scenarios and how the numbers affect each other.",
        heatmapLegendDivident: "divident",
        heatmapLegendSalary: "salary",
        heatmapGrossLabel: "Gross",
        heatmapTaxLabel: "Tax",
        heatmapDividentLabel: "Dividend",
        heatmapCompanyTaxLabel: "Corporate tax *",
        heatmapSalaryLabel: "Salary",
        heatmapTotalLabel: "Total",
        heatmapNetLabel: "Net amount",
        heatmapCompanyProfit: "Company revenue",
        heatMapCompanyTaxDescription:
          "* Corporate tax your company has paid from the divident amount.",
        calculationsTitle: "Calculations",
        calculationsDescriptionIdealNotCheapest:
          "Here you can see your most cost-efficient option based on the minimum net income you inputted. For comparison, you can also see the most cheapest and expensive option.",
        calculationsDescriptionIdealCheapest:
          "Here you can see your most cost-efficient option based on the minimum net income you inputted. For comparison, you can see the most expensive option.",
        cardBestOption: "best option for you",
        cheapestOption: "cheapest option",
        mostExpensiveOption: "most expensive option",
        cardDivident: "dividend",
        cardSalary: "salary",
        wouldSaveInTaxes: "would reduce your personal taxation by",
        wouldIncreaseTaxes: "would increase your personal taxation by",
        wouldSaveInDividentTax: "would reduce taxes paid from divident by",
        wouldIncreaseDividentTax:
          "would increase the taxes paid from divident by",
        and: "and",
        but: "but",
        nextCheapest: "The next cheapest option",
        netIncome: "net income",
        inTotalYouWouldSave: "Approximate total money saved",
        tableNetIncome: "Net income",
        tableSalary: "Salary",
        tableIncomeTax: "Income tax",
        tableDivident: "Dividend",
        tableCapitalGainsTax: "Capital gain tax",
        tableCompanyTax: "Corporate tax *",
        tableCompanyTaxOfDivident: "dividend",
        tableCorporateTaxDescription:
          "* Corporate tax your company has paid from the divident amount.",
        tableTaxesInTotal: "Total taxation",
        informationTitle: "More information?",
        informationDescription:
          "Something in the calculation bugging you? Found a bug? Please leave a message and we'll try to get back to you as soon as possible.",
        informationFeedbackButton: "Leave feedback",
        footer:
          "The figures calculated by the service are indicative estimates based on averages and the data collected. osinkoavaipalkkaa.fi does not take responsibility for the information calculated by the service or its accuracy. The user of the service is responsible for the use of the information provided by the service. <br /><br />The information entered by users into the service is not collected or stored.",
      },
    },
    fi: {
      translation: {
        title: "Osinkoa vai palkkaa?",
        subtitle: "Ja kuinka paljon?",
        description:
          "Kannattaako yrityksestä nostaa palkkaa vai osinkoa ja minkä verran? <strong>Osinkoa vai palkkaa</strong> auttaa sinua löytämään oikean määrän palkkaa ja osinkoa suhteessa maksettavien verojen määrään. Palvelu on tarkoitettu pääasiassa oman osakeyhtiön omistaville freelancereille ja yksityisyrittäjille.",
        start: "Aloita syöttämällä perustiedot",
        startHelp:
          "Täytä seuraavat 3 kenttää. Näiden tietojen perusteella muodostamme laskemme kaikki mahdolliset skenaariot.",
        inputsNetFunds: "Yrityksen nettovarallisuus tilikauden alussa",
        inputsProfitPredition: "Ennuste yrityksen voitosta ennen palkkakuluja",
        inputMinimumIncome: "Halutun nettotulon alaraja",
        scenariosTitle: "Palkan & osingon suhde verotukseen",
        scenariosDescription:
          "Yrityksestä nostettu raha vaikuttaa maksettavien verojen määrään. Seuraavasta taulukosta näet verotuksellisesti edullisimman vaihtoehdon.",
        heatmapLegendDivident: "osinko",
        heatmapLegendSalary: "palkka",
        heatmapGrossLabel: "Brutto",
        heatmapTaxLabel: "Vero",
        heatmapDividentLabel: "Osinko",
        heatmapCompanyTaxLabel: "Yhteisövero *",
        heatmapSalaryLabel: "Palkka",
        heatmapTotalLabel: "Yhteensä",
        heatmapNetLabel: "Nettosumma",
        heatmapCompanyProfit: "Yrityksen tulos",
        heatMapCompanyTaxDescription:
          "* aikaisemmin osingoista maksettu yhteisövero",
        calculationsTitle: "Laskelmat",
        calculationsDescriptionIdealNotCheapest:
          "Seuraavassa sinulle sopivin vaihtoehto syöttämääsi nettotulon alarajaan suhteutettuna. Mukana vertailun vuoksi myös verotuksellisesti halvin, sekä kaikista kallein vaihtoehto.",
        calculationsDescriptionIdealCheapest:
          "Seuraavassa sinulle sopivin vaihtoehto syöttämääsi nettotulon alarajaan suhteutettuna. Mukana vertailun vuoksi myös kaikista kallein vaihtoehto.",
        cardBestOption: "sinulle paras vaihtoehto",
        cheapestOption: "halvin vaihtoehto",
        mostExpensiveOption: "kallein vaihtoehto",
        cardDivident: "osinkoa",
        cardSalary: "palkkaa",
        wouldSaveInTaxes: "säästäisi omassa verotuksessasi",
        wouldIncreaseTaxes: "kasvattaisi omaa verotustasi",
        wouldSaveInDividentTax: "säästäisi osingoista verotettavaa määrää",
        wouldIncreaseDividentTax: "kasvattaisi osingoista verotettavaa määrää",
        and: "ja",
        but: "mutta",
        nextCheapest: "Seuraavaksi halvin vaihtoehto",
        netIncome: "nettotuloa",
        inTotalYouWouldSave: "Kokonaisuudessaan rahaa säästyisi noin",
        tableNetIncome: "Nettotulo",
        tableSalary: "Palkkaa",
        tableIncomeTax: "Tulovero",
        tableDivident: "Osinkoa",
        tableCapitalGainsTax: "Pääomatulovero",
        tableCompanyTax: "Yhteisövero *",
        tableCompanyTaxOfDivident: "osingosta",
        tableCorporateTaxDescription:
          "* aikaisemmin osingoista maksettu yhteisövero.",
        tableTaxesInTotal: "Veroja yhteensä",
        informationTitle: "Lisätietoa?",
        informationDescription:
          "Haluaisitko saada vieläkin tarkempaa tietoa eri vaihtoehdoista osakeyhtiön palkanmaksuun liittyen? Onko mielessäsi parannusehdotus tai kommentti palveluun liittyen?",
        informationFeedbackButton: "Lähetä palautetta",
        footer:
          "Palvelun laskemat luvut ovat kerättyyn aineistoon ja keskiarvioihin perustuvia suuntaa antavia arvioita. <br /> osinkoavaipalkkaa.fi ei ota vastuuta palvelun laskemista tiedoista eikä niiden oikeellisuudesta. <br />Palvelun käyttäjä kantaa itse vastuun palvelun antamien tietojenhyödyntämisestä.<br /><br />Käyttäjien palveluun syöttämiä tietoja ei kerätä eikä tallenneta.",
      },
    },
  },
  lng: "en",
  fallbackLng: "en",

  interpolation: {
    escapeValue: false,
  },
})

i18n.languages = ["fi", "en"]

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
              d={`M${
                points[INCOME_TAX.indexOf(getIncomeTaxBracket(ideal.salary))][0]
              } 0 l0 50`}
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
          getContent={(id) => {
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
  ...mapValues(state, (val) => (val === 0 ? "" : val.toString())),
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
      keyof typeof draftState
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

  const brackets = range(100).map((i) => i / 100)

  const permutations = permutate<number>(
    brackets,
    brackets
  ).map(([dividents, salary]) =>
    disabled
      ? [roundTo1000(100000 * dividents), roundTo1000(30000 * salary)]
      : [
          roundTo1000(state.companyNetWorth * dividents),
          roundTo1000(
            Math.max(
              state.companyProfitEstimate * salary,
              state.companyNetWorth * salary
            )
          ),
        ]
  )

  const unsortedScenarios = uniqBy(permutations, ([a, b]) => `${a}${b}`)
    .filter(([dividents, salary]) => {
      return disabled
        ? true
        : salary + dividents <=
            state.companyProfitEstimate + state.companyNetWorth
    })
    .map(([dividents, salary]) => {
      const companyTaxes = getCorporateTax(state.companyProfitEstimate - salary)

      const totalSharesInCompany = state.companyNetWorth

      return {
        dividents,
        companyTaxesFromDividents: companyTaxesFromDividents(dividents),
        salary,
        capitalGainsTax: getCapitalGainsTaxEuroAmount(
          dividents,
          totalSharesInCompany
        ),
        incomeTax: getIncomeTaxEuroAmount(salary),
        netIncome: getNetIncome(salary, dividents, totalSharesInCompany),
        grossIncome: salary + dividents,
        netSalary: salary - getIncomeTaxEuroAmount(salary),
        incomeTaxPercentage: getIncomeTaxBracket(salary).percentage,
        taxes: getTotalTaxEuroAmount(salary, dividents, totalSharesInCompany),
        personalTaxes: getPersonalTaxes(
          salary,
          dividents,
          totalSharesInCompany
        ),
        companyTaxes,
        companyProfit: state.companyProfitEstimate - salary,
      }
    })

  const scenarios = sortByBest(unsortedScenarios)

  const [cheapest] = scenarios
  const mostExpensive = scenarios[scenarios.length - 1]
  const ideal =
    scenarios.filter(({ netIncome }) => netIncome >= state.livingExpenses)[0] ||
    cheapest

  const nextCheapest = scenarios[scenarios.indexOf(ideal) - 1]
  const { t } = useTranslation()
  return (
    <div>
      <header>
        <SEO />
        <h1>{t("title")}</h1>
        <h2>{t("subtitle")}</h2>
        <p>
          <Trans i18nKey="description" />
        </p>
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
            {/* <Chart ideal={ideal} label="Palkkatulon vaikutus verotukseen" /> */}
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
                        <Currency>{scenario.capitalGainsTax}</Currency>
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
                  href="https://forms.gle/xZovhsW5GDB3J8w39"
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
  <I18nextProvider i18n={i18n}>
    <IndexPage />
  </I18nextProvider>
)
