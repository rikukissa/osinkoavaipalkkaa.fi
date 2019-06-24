import React from "react"

export function Currency(props: { children: number }) {
  return (
    <>
      {new Intl.NumberFormat("fi-FI", {
        style: "currency",
        currency: "EUR",

        minimumFractionDigits: 0,
        maximumFractionDigits: 0,
      }).format(props.children)}
    </>
  )
}
