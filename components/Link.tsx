import cn from "classnames"
import NextLink, { LinkProps as NextLinkProps } from "next/link"
import React from "react"

export interface LinkProps extends NextLinkProps {
  className?: string
  children: React.ReactNode
}

function Link(props: LinkProps): JSX.Element {
  const { className, children, ...otherProps } = props

  return (
    <NextLink {...otherProps}>
      {/* eslint-disable-next-line jsx-a11y/anchor-is-valid */}
      <a
        className={cn(
          "text-base text-indigo-600 font-medium hover:text-indigo-700 hover:underline",
          className
        )}
      >
        {children}
      </a>
    </NextLink>
  )
}

export { Link }
