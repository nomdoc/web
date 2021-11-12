import { ErrorProps } from "next/error"
import React from "react"

export default function Error(props: ErrorProps): JSX.Element {
  const { statusCode } = props

  return (
    <p>
      {statusCode
        ? `An error ${statusCode} occurred on server.`
        : "An error occurred on client."}
    </p>
  )
}

Error.getInitialProps = (ctx) => {
  const { res, err } = ctx
  const statusCode = res ? res.statusCode : err ? err.statusCode : 404

  return { statusCode }
}
