import cn from "classnames"
import React from "react"
import {
  useController,
  UseControllerProps,
  useFormContext,
} from "react-hook-form"

export interface InputFieldProps
  extends Omit<UseControllerProps, "control">,
    Omit<
      React.DetailedHTMLProps<
        React.InputHTMLAttributes<HTMLInputElement>,
        HTMLInputElement
      >,
      "name" | "defaultValue"
    > {
  type: string
}

function InputField(props: InputFieldProps): JSX.Element {
  const {
    id,
    className,
    name,
    rules,
    defaultValue,
    shouldUnregister,
    ...otherProps
  } = props

  const { control } = useFormContext()
  const {
    field: { value, ...otherFields },
    fieldState: { error },
  } = useController({ name, rules, control, defaultValue, shouldUnregister })

  const isRequired = rules && rules.required ? true : false
  const hasError = !!error

  let ariaProps: Record<string, string | boolean> = {
    "aria-required": isRequired,
  }

  if (hasError) {
    ariaProps = {
      ...ariaProps,
      "aria-invalid": true,
      "aria-errormessage": `${name}-error`,
    }
  }

  return (
    <input
      {...otherFields}
      {...ariaProps}
      {...otherProps}
      value={value || ""}
      id={id || name}
      required={isRequired}
      className={cn(
        "block w-full px-2 py-2.5 text-base text-gray-700 placeholder-gray-400 appearance-none rounded-md shadow-sm border border-gray-300 bg-white disabled:opacity-70 disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500",
        className
      )}
    />
  )
}

InputField.displayName = "InputField"

export { InputField }
