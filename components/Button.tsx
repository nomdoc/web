import { Loading as LoadingIcon } from "@icon-park/react"
import cx from "classnames"
import React from "react"

export type ButtonType = "submit" | "reset" | "button"
export type ButtonState = "idle" | "loading" | "disabled"
export type ButtonSize = "default" | "compact"
export type ButtonTheme = "dark" | "light"
export type ButtonKind = "contained" | "outline" | "flat"

export interface ButtonProps
  extends React.DetailedHTMLProps<
    React.ButtonHTMLAttributes<HTMLButtonElement>,
    HTMLButtonElement
  > {
  type: ButtonType
  state?: ButtonState
  text?: string
  size?: ButtonSize
  theme?: ButtonTheme
  kind?: ButtonKind
  screenReaderHint?: string
  icon?: React.ReactNode
  leftIcon?: JSX.Element
  rightIcon?: JSX.Element
  className?: string
}

function Button(props: ButtonProps): JSX.Element {
  const {
    type,
    state = "idle",
    text,
    size = "default",
    theme = "light",
    kind = "contained",
    screenReaderHint,
    icon: Icon,
    leftIcon: LeftIcon,
    rightIcon: RightIcon,
    className,
    ...otherProps
  } = props

  const isIdle = state === "idle"
  const isLoading = state === "loading"
  const isDisabled = state === "disabled"

  const isTextButton = text !== undefined
  const isIconButton = Icon !== undefined

  const isDefaultSize = size === "default"
  const isCompactSize = size === "compact"

  const isLight = theme === "light"
  const isDark = theme === "dark"

  const isContained = kind === "contained"
  const isOutline = kind === "outline"
  const isFlat = kind === "flat"

  const buttonClasses = cx({
    relative: true,
    "inline-flex": true,
    "items-center": true,
    "justify-center": true,
    "font-medium": true,
    "leading-4": isTextButton && isCompactSize,
    "text-base": isDefaultSize,
    "text-sm": isCompactSize,
    "text-white": (isLight && isContained) || (isDark && (isOutline || isFlat)),
    "text-gray-700": isLight && (isOutline || isFlat),
    "text-indigo-600": isDark && isContained,
    "px-4 py-2.5": isTextButton && isDefaultSize,
    "px-2.5 py-1.5": isTextButton && isCompactSize,
    "p-2.5": isIconButton && isDefaultSize,
    "p-1.5": isIconButton && isCompactSize,
    border: true,
    "border-transparent": isContained || isFlat,
    "border-gray-300": isOutline,
    "rounded-md": true,
    "cursor-pointer": isIdle,
    "cursor-not-allowed": isDisabled || isLoading,
    "shadow-sm": isContained || isOutline,
    "opacity-50": isDisabled || isLoading,
    "bg-indigo-600":
      (isLight && isContained) || (isDark && (isOutline || isFlat)),
    "bg-white": (isDark && isContained) || (isLight && (isOutline || isFlat)),
    "hover:bg-indigo-700":
      isIdle && ((isLight && isContained) || (isDark && (isOutline || isFlat))),
    "hover:bg-gray-100":
      isIdle && ((isDark && isContained) || (isLight && (isOutline || isFlat))),
    "focus:outline-none": true,
    "focus:ring-2": true,
    "focus:ring-offset-2": true,
    "focus:ring-offset-white": isLight,
    "focus:ring-offset-indigo-600": isDark,
    "focus:ring-indigo-500": isLight,
    "focus:ring-white": isDark,
    [className]: !!className,
  })

  const iconClasses = cx({
    "h-6 w-6": isDefaultSize,
    "h-5 w-5": isCompactSize,
  })

  const sideIconClasses = cx({
    "flex-shrink-0": true,
    "h-5 w-5": isDefaultSize,
    "h-4 w-4": isCompactSize,
  })

  const leftIconClasses = cx({
    "mr-2 -ml-1": isDefaultSize,
    "mr-2 -ml-0.5": isCompactSize,
  })

  const rightIconClasses = cx({
    "ml-2 -mr-1": isDefaultSize,
    "ml-2 -mr-0.5": isCompactSize,
  })

  return (
    <button
      {...otherProps}
      // eslint-disable-next-line react/button-has-type
      type={type}
      disabled={isDisabled || isLoading}
      className={buttonClasses}
    >
      {isLoading ? (
        <LoadingIcon
          className={`animate-spin ${sideIconClasses} ${leftIconClasses}`}
          aria-hidden="true"
        />
      ) : (
        LeftIcon &&
        React.cloneElement(LeftIcon, {
          className: `${sideIconClasses} ${leftIconClasses}`,
          "aria-hidden": true,
        })
      )}
      {isIconButton ? (
        <>
          <span className="sr-only">{screenReaderHint}</span>
          <span className={iconClasses} aria-hidden>
            {Icon}
          </span>
        </>
      ) : isTextButton ? (
        <span className="line-clamp-1">{text}</span>
      ) : null}
      {RightIcon &&
        React.cloneElement(RightIcon, {
          className: `${sideIconClasses} ${rightIconClasses}`,
          "aria-hidden": true,
        })}
    </button>
  )
}

export { Button }
