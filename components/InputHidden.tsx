import React from "react"
import {
  useController,
  UseControllerProps,
  useFormContext,
} from "react-hook-form"

export interface InputFieldProps extends Omit<UseControllerProps, "control"> {
  id?: string
}

function InputHidden(props: InputFieldProps): JSX.Element {
  const { id, name, rules, ...otherControllerProps } = props

  const { control } = useFormContext()
  const {
    field: { value, ...otherFields },
  } = useController({ name, rules, control, ...otherControllerProps })

  return (
    <input {...otherFields} value={value || ""} id={id || name} type="hidden" />
  )
}

InputHidden.displayName = "InputField"

export { InputHidden }
