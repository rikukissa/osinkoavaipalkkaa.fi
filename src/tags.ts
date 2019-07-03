export function sendEvent(event: string, data?: any) {
  const dataLayer = (window as any).dataLayer
  if (dataLayer) {
    dataLayer.push({ event })
  }
}
