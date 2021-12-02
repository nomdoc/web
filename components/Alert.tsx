import {
  Attention as AttentionIcon,
  CheckOne as CheckOneIcon,
  CloseOne as CloseOneIcon,
  Info as InfoIcon,
} from "@icon-park/react"
import React from "react"

export type AlertKind = "error" | "attention" | "info" | "success"

export type AlertProps = {
  kind?: AlertKind
  title: string
  description?: string
  points?: string[]
}

const AlertIcon = {
  error: <CloseOneIcon />,
  attention: <AttentionIcon />,
  info: <InfoIcon />,
  success: <CheckOneIcon />,
}

const bgColor = {
  error: "bg-red-50",
  attention: "bg-yellow-50",
  info: "bg-blue-50",
  success: "bg-green-50",
}

const iconColor = {
  error: "text-red-400",
  attention: "text-yellow-400",
  info: "text-blue-400",
  success: "text-green-400",
}

const titleColor = {
  error: "text-red-800",
  attention: "text-yellow-800",
  info: "text-blue-800",
  success: "text-green-800",
}

const textColor = {
  error: "text-red-700",
  attention: "text-yellow-700",
  info: "text-blue-700",
  success: "text-green-700",
}

function Alert(props: AlertProps): JSX.Element {
  const { kind = "info", title, description, points } = props

  const Icon = AlertIcon[kind]

  return (
    <div className={`rounded-md ${bgColor[kind]} p-4`}>
      <div className="flex items-center">
        {React.cloneElement(Icon, {
          theme: "filled",
          className: `flex-shrink-0 h-4 w-4 ${iconColor[kind]}`,
          "aria-hidden": true,
        })}

        <h3 className={`ml-3 text-sm font-medium ${titleColor[kind]}`}>
          {title}
        </h3>
      </div>

      {description && (
        <p className={`mt-2 ml-7 text-sm ${textColor[kind]}`}>{description}</p>
      )}

      {points && points.length > 0 && (
        <ul
          className={`mt-2 ml-7 pl-5 space-y-1 text-sm ${textColor[kind]} list-disc`}
        >
          {points.map((point) => (
            <li key={`alert-${point}`}>{point}</li>
          ))}
        </ul>
      )}
    </div>
  )
}

export { Alert }
