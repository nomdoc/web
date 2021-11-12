import React from "react"

export type InputLabelProps = {
  htmlFor: string
  title: string
  cornerHint?: string
}

function InputLabel(props: InputLabelProps): JSX.Element {
  const { htmlFor, title, cornerHint } = props

  return (
    <div className="flex justify-between mb-2">
      <label
        htmlFor={htmlFor}
        className="flex-grow block text-base font-medium text-gray-700"
      >
        {title}
      </label>
      {cornerHint && (
        <span className="text-base italic text-gray-500" id="email-optional">
          {cornerHint}
        </span>
      )}
    </div>
  )
}

export { InputLabel }
