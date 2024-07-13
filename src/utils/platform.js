export function isSupportWebCodecs() {
  return typeof window.MediaStreamTrackProcessor === "function"
}
const isIPad = () => {
  return /MacIntel/i.test(navigator.platform) && navigator?.maxTouchPoints > 2
}
export const isIOSMobile = () => {
  const { userAgent } = navigator
  const isIOS = /iPad|iPhone|iPod/i.test(userAgent)
  return isIOS || isIPad()
}

export function isAndroidBrowser() {
  return /android/i.test(navigator.userAgent)
}
export function isAndroidOrIOSBrowser() {
  return isAndroidBrowser() || isIOSMobile()
}
class OffscreenCanvasCapability {
  get isSupported() {
    if (this.value === undefined) {
      const isOffscreenCanvas = typeof window.OffscreenCanvas === "function"
      if (isOffscreenCanvas) {
        const canvas = new window.OffscreenCanvas(1, 1)
        canvas.addEventListener("webglcontextlost", event => {
          event.preventDefault()
        })
        this.value = !!canvas.getContext("webgl")
      } else {
        this.value = false
      }
    }
    return this.value
  }
}
const offscreenCanvasCapality = new OffscreenCanvasCapability()
export function isSupportOffscreenCanvas() {
  return offscreenCanvasCapality.isSupported
}
