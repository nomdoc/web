import getConfig from "next/config"
import { useCallback, useEffect, useState } from "react"
import { SCRIPT_READY, useScript } from "./use-script"

const { publicRuntimeConfig } = getConfig()

const sdkUrl = publicRuntimeConfig.googleRecaptchaSdkUrl
const siteKey = publicRuntimeConfig.googleRecaptchaKeyId

export const RECAPTCHA_LOADING = 0
export const RECAPTCHA_READY = 1

export type RecaptchaStatus = typeof RECAPTCHA_LOADING | typeof RECAPTCHA_READY

export type UseRecaptchaReturn = {
  status: RecaptchaStatus
  execute(action: string): Promise<string>
}

function useRecaptcha(): UseRecaptchaReturn {
  const [status, setStatus] = useState<RecaptchaStatus>(RECAPTCHA_LOADING)
  const scriptStatus = useScript(`${sdkUrl}?render=${siteKey}`, { defer: true })

  const execute = useCallback(
    async (action: string) =>
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (window as any).grecaptcha.enterprise.execute(siteKey, { action }),
    []
  )

  useEffect(() => {
    if (scriptStatus !== SCRIPT_READY) return

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const recaptcha = (window as any).grecaptcha

    recaptcha.enterprise.ready(async () => {
      setStatus(RECAPTCHA_READY)
    })
  }, [scriptStatus])

  return {
    status,
    execute,
  }
}

export { useRecaptcha }
