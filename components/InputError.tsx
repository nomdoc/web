import { Attention as AttentionIcon } from "@icon-park/react"
import React from "react"
import { useFormContext } from "react-hook-form"

function replaceFieldName(
  textWithFieldName: string,
  textWithoutFieldName: string,
  fieldName?: string
) {
  return fieldName
    ? textWithFieldName.replace("#{fieldName}", fieldName)
    : textWithoutFieldName
}

function formatSuperstructError(message: string, fieldName?: string) {
  switch (true) {
    case message.includes(
      "Expected a nonempty string but received an empty one"
    ):
      return replaceFieldName(
        "#{fieldName} is required.",
        "Required.",
        fieldName
      )

    case message.includes("Expected a string, but received: undefined"):
      return replaceFieldName(
        "#{fieldName} is required.",
        "Required.",
        fieldName
      )

    case message.includes("Expected a string matching"):
      return replaceFieldName(
        "#{fieldName} format is invalid.",
        "Invalid format.",
        fieldName
      )

    default:
      return message
  }
}

export type InputErrorProps = {
  htmlFor: string
  fieldName?: string
  message?: string
}

function UncontrolledInputError(props: InputErrorProps): JSX.Element {
  const { htmlFor, message } = props

  const id = `${htmlFor}-error`

  return (
    <div id={id} className="flex mt-2 text-red-600">
      <AttentionIcon
        theme="filled"
        className="flex-shrink-0 mt-1 mr-2 h-4 w-4"
        aria-hidden="true"
      />
      <p className="text-base">{message}</p>
    </div>
  )
}

function InputError(props: InputErrorProps): JSX.Element | null {
  const { htmlFor, fieldName, message } = props
  const {
    formState: {
      isSubmitted: isFormSubmitted,
      touchedFields: formTouchedFields,
      errors: formErrors,
    },
  } = useFormContext()

  const hasError = !!formErrors[htmlFor]
  const isTouched = !!formTouchedFields[htmlFor]
  const showError = (isFormSubmitted && hasError) || (hasError && isTouched)

  if (showError) {
    const displayMessage =
      message || formatSuperstructError(formErrors[htmlFor].message, fieldName)

    return <UncontrolledInputError htmlFor={htmlFor} message={displayMessage} />
  }

  return null
}

export { InputError, UncontrolledInputError }
