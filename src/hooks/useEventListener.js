import { useRef, useEffect } from "react"
export function useEventListener(
  target,
  eventName,
  handler,
  options = { capture: false, passive: false }
) {
  const handlerRef = useRef()
  handlerRef.current = handler
  useEffect(() => {
    let targetElement = null
    if (!target) {
      targetElement = window
    } else if (Object.hasOwn(target, "current")) {
      targetElement = target.current
    } else {
      targetElement = target
    }
    if (targetElement?.addEventListener) {
      const eventListener = event => handlerRef.current?.(event)
      targetElement.addEventListener(eventName, eventListener, {
        capture: options.capture,
        passive: options.passive
      })
      return () => {
        targetElement?.removeEventListener(eventName, eventListener, {
          capture: options.capture
        })
      }
    }
    return () => {
      //
    }
  }, [target, eventName, options])
}
