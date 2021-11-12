// TODO update this line when
// https://github.com/react-hook-form/resolvers/issues/271 is closed
import { superstructResolver } from "@hookform/resolvers/superstruct/dist/superstruct"
import {
  Attention as AttentionIcon,
  Loading as LoadingIcon,
} from "@icon-park/react"
import getConfig from "next/config"
import Image from "next/image"
import { useRouter } from "next/router"
import React, { useEffect, useState } from "react"
import { FormProvider, useForm } from "react-hook-form"
import * as ss from "superstruct"
import { Infer } from "superstruct"
import { Button } from "../components/Button"
import { InputError } from "../components/InputError"
import { InputField } from "../components/InputField"
import {
  handleError,
  isValidationError,
  OnResponseErrorProps,
} from "../libs/errors"
import { AUTHENTICATED, putAuthenticated, useSession } from "../libs/session"
import { useScript } from "../libs/use-script"
import { emailAddressRegex } from "../libs/utils"

const PICK_LOGIN_METHOD = 0
const LOGIN_TOKEN_SENT = 1
const VERIFY_LOGIN_TOKEN = 2
type LoginStep =
  | typeof PICK_LOGIN_METHOD
  | typeof LOGIN_TOKEN_SENT
  | typeof VERIFY_LOGIN_TOKEN

const EMAIL_ADDRESS_INPUT = "emailAddress"

const loginWithTokenFormSchema = ss.object({
  [EMAIL_ADDRESS_INPUT]: ss.nonempty(
    ss.pattern(ss.trimmed(ss.string()), emailAddressRegex())
  ),
})

export type LoginWithTokenFormPayload = Infer<typeof loginWithTokenFormSchema>

export type LoginWithTokenFormProps = {
  setNextStep(step: LoginStep): void
}

function LoginWithTokenForm(props: LoginWithTokenFormProps) {
  const { setNextStep } = props
  const form = useForm({
    mode: "all",
    resolver: superstructResolver(loginWithTokenFormSchema),
  })
  const { push: pushRoute } = useRouter()
  const session = useSession()

  const {
    setError: setFormError,
    formState: {
      isDirty: isFormDirty,
      isSubmitting: isFormSubmitting,
      isValid: isFormValid,
    },
  } = form

  function handleResponseError(oreProps: OnResponseErrorProps) {
    const { data } = oreProps

    if (isValidationError(data)) {
      data.errors.array.forEach((error) => {
        if (error.field && error.message) {
          setFormError(error.field, {
            type: "manual",
            message: error.message,
          })
        }
      })
    }
  }

  function handleOtherError(err: Error) {
    if (err.message === "Already logged in.") {
      pushRoute("/jobs")
    }
  }

  async function handleSubmit(data: LoginWithTokenFormPayload) {
    try {
      await session.loginWithToken(data[EMAIL_ADDRESS_INPUT])

      setNextStep(LOGIN_TOKEN_SENT)
    } catch (err) {
      handleError(err, {
        onResponseError: handleResponseError,
        onOtherError: handleOtherError,
      })
    }
  }

  return (
    <FormProvider {...form}>
      <form onSubmit={form.handleSubmit(handleSubmit)}>
        <fieldset>
          <div>
            <InputField
              type="string"
              name={EMAIL_ADDRESS_INPUT}
              placeholder="youremail@example.com"
            />
            <InputError
              htmlFor={EMAIL_ADDRESS_INPUT}
              fieldName="Email address"
            />
          </div>
        </fieldset>
        <Button
          state={
            !isFormDirty || !isFormValid
              ? "disabled"
              : isFormSubmitting
              ? "loading"
              : "idle"
          }
          type="submit"
          text="Continue with email"
          className="w-full mt-4"
        />
      </form>
    </FormProvider>
  )
}

const GOOGLE_LOGIN_BTN_ID = "google-login-button"

export type LoginMethodPickerProps = {
  setNextStep(step: LoginStep): void
}

function LoginMethodPicker(props: LoginMethodPickerProps) {
  const { setNextStep } = props
  const [googleLoginErrorMsg, setGoogleLoginErrorMsg] = useState()
  const { publicRuntimeConfig } = getConfig()
  const gsiScriptStatus = useScript(publicRuntimeConfig.googleSignInSdkUrl, {
    defer: true,
  })
  const [isGsiInitialized, setIsGsiInitialized] = useState(false)
  const [isGsiRendered, setIsGsiRendered] = useState(false)
  const { verifyGoogleIdToken } = useSession()
  const { push: pushRoute } = useRouter()

  useEffect(() => {
    if (gsiScriptStatus !== "ready") return
    if (isGsiInitialized) return

    function handleResponseError(oreProps: OnResponseErrorProps) {
      const { data } = oreProps

      if (data.code === "login_failed" && data.message) {
        setGoogleLoginErrorMsg(data.message)
      }
    }

    function handleOtherError(err: Error) {
      if (err.message === "Already logged in.") {
        pushRoute("/jobs")
      }
    }

    async function handleGoogleCredentialResponse(response) {
      try {
        const { data } = await verifyGoogleIdToken(response.credential)

        putAuthenticated(data.accessToken, data.accessTokenExpiredAt)
        pushRoute("/jobs")
      } catch (err) {
        handleError(err, {
          onResponseError: handleResponseError,
          onOtherError: handleOtherError,
        })
      }
    }

    // TODO put this in next.config
    // TODO find Google Accounts ts definition. There must be one out there!
    google.accounts.id.initialize({
      client_id: publicRuntimeConfig.googleOauthClientId,
      callback: handleGoogleCredentialResponse,
    })

    setIsGsiInitialized(true)
  }, [
    gsiScriptStatus,
    isGsiInitialized,
    verifyGoogleIdToken,
    pushRoute,
    publicRuntimeConfig,
  ])

  useEffect(() => {
    if (gsiScriptStatus !== "ready") return
    if (!isGsiInitialized) return
    if (isGsiRendered) return

    google.accounts.id.renderButton(
      document.getElementById(GOOGLE_LOGIN_BTN_ID),
      {
        theme: "filled_blue",
        size: "large",
        text: "continue_with",
      }
    )

    setIsGsiRendered(true)
  }, [gsiScriptStatus, isGsiInitialized, isGsiRendered])

  return (
    <div>
      <h2 className="mt-6 text-3xl font-extrabold text-gray-700">
        Log in to your account
      </h2>

      <p className="mt-2 text-base text-gray-700">
        We will send a login link to your email.
      </p>

      <div className="mt-8">
        <LoginWithTokenForm setNextStep={setNextStep} />
      </div>

      <div className="relative my-6">
        <div className="absolute inset-0 flex items-center" aria-hidden="true">
          <div className="w-full border-t border-gray-300" />
        </div>
        <div className="relative flex justify-center">
          <span className="px-2 bg-white text-sm text-gray-500">Or</span>
        </div>
      </div>

      <div className="flex justify-center">
        <div className="relative">
          <div id={GOOGLE_LOGIN_BTN_ID} className="flex justify-center h-10" />

          {googleLoginErrorMsg && (
            <div className="flex mt-2 text-red-600">
              <AttentionIcon
                theme="filled"
                className="flex-shrink-0 block mt-1 mr-2 h-4 w-4"
                aria-hidden="true"
              />
              <div className="text-base">{googleLoginErrorMsg}</div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

function LoginTokenSent() {
  return (
    <div>
      <h2 className="mt-6 text-3xl font-extrabold text-gray-700">
        We sent you a login link.
      </h2>

      <p className="mt-2 text-base text-gray-700">
        Please check your email and click on the link to login. You may close
        this tab.
      </p>
    </div>
  )
}

export type VerifyLoginTokenProps = {
  loginToken: string
}

function VerifyLoginToken(props: VerifyLoginTokenProps) {
  const { loginToken } = props
  const { verifyLoginToken } = useSession()
  const [errorMsg, setErrorMsg] = useState()
  const { push: pushRoute } = useRouter()

  useEffect(() => {
    function handleResponseError(oreProps: OnResponseErrorProps) {
      const { data } = oreProps

      if (data.code === "login_failed" && data.message) {
        setErrorMsg(data.message)
      }
    }

    function handleOtherError(err: Error) {
      if (err.message === "Already logged in.") {
        pushRoute("/jobs")
      }
    }

    ;(async () => {
      if (loginToken) {
        try {
          const { data } = await verifyLoginToken(loginToken)

          putAuthenticated(data.accessToken, data.accessTokenExpiredAt)
          pushRoute("/jobs")
        } catch (err) {
          handleError(err, {
            onResponseError: handleResponseError,
            onOtherError: handleOtherError,
          })
        }
      }
    })()
  }, [loginToken, verifyLoginToken, pushRoute])

  if (errorMsg) {
    return (
      <div>
        <h2 className="mt-6 text-3xl font-extrabold text-gray-700">
          Failed to login.
        </h2>
        <p className="mt-2 text-base text-gray-700">{errorMsg}</p>
      </div>
    )
  }

  return (
    <div>
      <h2 className="mt-6 text-3xl font-extrabold text-gray-700">
        Verifying your login.
      </h2>

      <p className="flex items-center mt-2 text-base text-gray-700">
        <LoadingIcon
          className="block w-6 h-6 animate-spin"
          aria-hidden="true"
        />
        <span className="ml-2">Please wait while we verify your login.</span>
      </p>
    </div>
  )
}

function Login(): JSX.Element {
  const router = useRouter()
  const { status: sessionStatus } = useSession()
  const loginToken =
    typeof router.query.token === "string" ? router.query.token : undefined
  const { push: pushRoute } = router
  const [currentStep, setNextStep] = useState<LoginStep>(
    loginToken ? VERIFY_LOGIN_TOKEN : PICK_LOGIN_METHOD
  )

  useEffect(() => {
    if (sessionStatus === AUTHENTICATED) {
      pushRoute("/jobs")
    }
  }, [sessionStatus, pushRoute])

  return (
    <main className="min-h-screen bg-white flex">
      <div className="flex-1 flex items-center py-12 px-4 sm:px-6 lg:flex-none lg:px-20 xl:px-24">
        <div className="mx-auto w-full max-w-sm lg:w-96">
          <Image
            src="/logos/nomdoc-indigo.svg"
            alt="Nomdoc"
            width={56}
            height={56}
          />

          {currentStep === PICK_LOGIN_METHOD && (
            <LoginMethodPicker setNextStep={setNextStep} />
          )}

          {currentStep === LOGIN_TOKEN_SENT && <LoginTokenSent />}

          {currentStep === VERIFY_LOGIN_TOKEN && (
            <VerifyLoginToken loginToken={loginToken} />
          )}
        </div>
      </div>
      <div className="hidden lg:block relative w-0 flex-1">
        <Image
          className="absolute inset-0 h-full w-full object-cover"
          src="/img/login-hero.jpeg"
          alt=""
          layout="fill"
        />
      </div>
    </main>
  )
}

export default Login
