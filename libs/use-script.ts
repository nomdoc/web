import { useEffect, useState } from "react"

export const SCRIPT_IDLE = "A"
export const SCRIPT_LOADING = "B"
export const SCRIPT_READY = "C"
export const SCRIPT_ERROR = "D"

export type Status =
  | typeof SCRIPT_IDLE
  | typeof SCRIPT_LOADING
  | typeof SCRIPT_READY
  | typeof SCRIPT_ERROR

export type UseScriptOptions = {
  defer?: boolean
}

function useScript(src: string, opts: UseScriptOptions = {}): Status {
  const { defer = false } = opts
  const [status, setStatus] = useState<Status>(
    src ? SCRIPT_LOADING : SCRIPT_IDLE
  )

  useEffect(() => {
    // Allow falsy src value if waiting on other data needed for
    // constructing the script URL passed to this hook.
    if (!src) {
      setStatus(SCRIPT_IDLE)
      return undefined
    }

    // Fetch existing script element by src
    // It may have been added by another instance of this hook
    let script = document.querySelector<HTMLScriptElement>(
      `script[src="${src}"]`
    )

    // Store status in attribute on script
    // This can be read by other instances of this hook
    function setAttributeFromEvent(event: Event) {
      if (!script) return

      script.setAttribute(
        "data-status",
        event.type === "load" ? SCRIPT_READY : SCRIPT_ERROR
      )
    }

    if (!script) {
      // Create script
      script = document.createElement("script")
      script.src = src
      script.defer = defer
      script.async = true
      script.setAttribute("data-status", "loading")
      // Add script to document body
      document.body.appendChild(script)

      script.addEventListener("load", setAttributeFromEvent)
      script.addEventListener("error", setAttributeFromEvent)
    } else {
      // Grab existing script status from attribute and set to state.
      setStatus(script.getAttribute("data-status") as Status)
    }

    // Script event handler to update status in state
    // Note: Even if the script already exists we still need to add
    // event handlers to update the state for *this* hook instance.
    function setStateFromEvent(event: Event) {
      setStatus(event.type === "load" ? SCRIPT_READY : SCRIPT_ERROR)
    }

    // Add event listeners
    script.addEventListener("load", setStateFromEvent)
    script.addEventListener("error", setStateFromEvent)

    // Remove event listeners on cleanup
    return () => {
      if (script) {
        script.removeEventListener("load", setStateFromEvent)
        script.removeEventListener("error", setStateFromEvent)
      }
    }
  }, [src, defer])

  return status
}

export { useScript }
