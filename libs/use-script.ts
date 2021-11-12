import { useEffect, useState } from "react"

export type Status = "idle" | "loading" | "ready" | "error"

export type UseScriptOptions = {
  defer?: boolean
}

function useScript(src: string, opts: UseScriptOptions = {}): Status {
  const { defer = false } = opts
  const [status, setStatus] = useState<Status>(src ? "loading" : "idle")

  useEffect(() => {
    // Allow falsy src value if waiting on other data needed for
    // constructing the script URL passed to this hook.
    if (!src) {
      setStatus("idle")
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
        event.type === "load" ? "ready" : "error"
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
      setStatus(event.type === "load" ? "ready" : "error")
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
  }, [src])

  return status
}

export { useScript }
