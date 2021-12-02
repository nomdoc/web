// TODO update this line when
// https://github.com/react-hook-form/resolvers/issues/271 is closed
import { superstructResolver } from "@hookform/resolvers/superstruct/dist/superstruct"
import Image from "next/image"
import { useRouter } from "next/router"
import React, { useEffect, useState } from "react"
import { FormProvider, useForm } from "react-hook-form"
import * as ss from "superstruct"
import { Infer } from "superstruct"
import { Alert } from "../components/Alert"
import { Button } from "../components/Button"
import { InputError } from "../components/InputError"
import { InputField } from "../components/InputField"
import { InputLabel } from "../components/InputLabel"
import { Link } from "../components/Link"
import {
  handleError,
  isValidationError,
  OnResponseErrorProps,
} from "../libs/errors"
import { AUTHENTICATED, useSession } from "../libs/session"
import { RECAPTCHA_READY, useRecaptcha } from "../libs/use-recaptcha"
import { emailAddressRegex, passwordRegex } from "../libs/utils"

const NAME_INPUT = "name"
const EMAIL_ADDRESS_INPUT = "emailAddress"
const PASSWORD_INPUT = "password"

const signUpFormSchema = ss.object({
  [NAME_INPUT]: ss.nonempty(ss.trimmed(ss.string())),
  [EMAIL_ADDRESS_INPUT]: ss.nonempty(
    ss.pattern(ss.trimmed(ss.string()), emailAddressRegex())
  ),
  [PASSWORD_INPUT]: ss.nonempty(
    ss.pattern(ss.trimmed(ss.string()), passwordRegex())
  ),
})

export type SignUpFormPayload = Infer<typeof signUpFormSchema>

function SignUp(): JSX.Element {
  const recaptcha = useRecaptcha()
  const { push: pushRoute } = useRouter()
  const session = useSession()
  const { status: sessionStatus } = session
  const form = useForm({
    mode: "all",
    resolver: superstructResolver(signUpFormSchema),
  })

  const {
    setError: setFormError,
    formState: {
      isDirty: isFormDirty,
      isSubmitting: isFormSubmitting,
      isValid: isFormValid,
    },
  } = form

  const [overallFormError, setOverallFormError] = useState<string>()

  function handleResponseError(oreProps: OnResponseErrorProps) {
    const { data } = oreProps

    if (isValidationError(data)) {
      data.errors.forEach((error) => {
        if (error.field && error.message) {
          setFormError(error.field, {
            type: "manual",
            message: error.message,
          })
        }
      })
    } else if (typeof data.message === "string") {
      setOverallFormError(data.message)
    }
  }

  function handleOtherError(err: Error) {
    if (err.message === "Already logged in.") {
      pushRoute("/jobs")
    }
  }

  async function handleSubmit(data: SignUpFormPayload) {
    try {
      await session.registerAccount(
        data[EMAIL_ADDRESS_INPUT],
        data[PASSWORD_INPUT]
      )

      pushRoute("/login")
    } catch (err) {
      handleError(err, {
        onResponseError: handleResponseError,
        onOtherError: handleOtherError,
      })
    }
  }

  useEffect(() => {
    if (sessionStatus === AUTHENTICATED) {
      pushRoute("/jobs")
    }
  }, [sessionStatus, pushRoute])

  return (
    <main>
      <div className="flex flex-col max-w-sm px-4 md:px-0 py-10 md:py-20 mx-auto">
        <Image
          src="/logos/nomdoc-indigo.svg"
          alt="Nomdoc"
          width={56}
          height={56}
        />

        <h2 className="mt-6 text-3xl font-extrabold text-gray-700 text-center">
          Welcome to Nomdoc
        </h2>

        <p className="mt-2 text-base text-gray-700 text-center">
          Create an account to start applying or posting jobs.
        </p>

        <div className="mt-12">
          {overallFormError && (
            <div className="mb-8">
              <Alert kind="error" title={overallFormError} />
            </div>
          )}
          <FormProvider {...form}>
            <form onSubmit={form.handleSubmit(handleSubmit)}>
              <fieldset className="space-y-4">
                <div>
                  <InputLabel htmlFor={NAME_INPUT} title="Name" />
                  <InputField
                    type="string"
                    name={NAME_INPUT}
                    placeholder="John Smith"
                  />
                  <InputError htmlFor={NAME_INPUT} fieldName="Name" />
                </div>
                <div>
                  <InputLabel
                    htmlFor={EMAIL_ADDRESS_INPUT}
                    title="Email address"
                  />
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
                <div>
                  <InputLabel htmlFor={PASSWORD_INPUT} title="Password" />
                  <InputField
                    type="password"
                    name={PASSWORD_INPUT}
                    placeholder="Choose a password"
                  />
                  <InputError
                    htmlFor={PASSWORD_INPUT}
                    fieldName="Password"
                    message="Password must contain at least 12 characters, one lowercase alphabet, one uppercase alphabet, one number and one special character."
                  />
                </div>
              </fieldset>
              <Button
                state={
                  !isFormDirty ||
                  !isFormValid ||
                  recaptcha.status !== RECAPTCHA_READY
                    ? "disabled"
                    : isFormSubmitting
                    ? "loading"
                    : "idle"
                }
                type="submit"
                text="Sign up"
                className="w-full mt-12"
              />
              <p className="mt-4 text-base text-gray-700 text-center">
                Already have an account? <Link href="/login">Log in here.</Link>
              </p>
            </form>
          </FormProvider>
        </div>
      </div>
    </main>
  )
}

export default SignUp
