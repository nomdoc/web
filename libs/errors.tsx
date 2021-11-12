import { isObject } from "./utils"

export type OnResponseErrorProps = {
  status: number
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  data: any
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  headers: Record<string, any>
}

export type HandleErrorProps = {
  /**
   * The request was made and the server responded with a status code that falls
   * out of the range of 2xx.
   */
  onResponseError?: (props: OnResponseErrorProps) => void
  /**
   * The request was made but no response was received, `error.request` is an
   * instance of XMLHttpRequest in the browser and an instance of
   * http.ClientRequest in Node.js.
   */
  onNetworkError?: () => void
  /**
   * The `/graph` request was made but there was errors.
   */
  onGraphError?: (err: unknown[]) => void
  /**
   * Something happened in setting up the request and triggered an Error
   */
  onOtherError?: (err: Error) => void
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function handleError(err: any, props: HandleErrorProps = {}) {
  const { onResponseError, onNetworkError, onGraphError, onOtherError } = props

  if (err) {
    if (err.response) {
      if (onResponseError) {
        onResponseError({
          status: err.response.status,
          data: err.response.data,
          headers: err.response.headers,
        })
      }
    } else if (err.request) {
      if (onNetworkError) {
        onNetworkError()
      }
    } else if (Array.isArray(err)) {
      if (onGraphError) {
        onGraphError(err)
      }
    } else if (err instanceof Error) {
      // Something happened in setting up the request and triggered an Error
      // or some other error
      if (onOtherError) {
        onOtherError(err)
      }
    }
  }
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function isValidationError(err: any) {
  return (
    isObject(err) &&
    err.code === "failed_validation" &&
    Array.isArray(err.errors)
  )
}

export { handleError, isValidationError }
