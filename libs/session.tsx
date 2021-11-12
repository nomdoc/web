import { AxiosRequestConfig, AxiosResponse } from "axios"
import cookie from "cookie"
import { GetServerSidePropsContext, NextPageContext } from "next"
import getConfig from "next/config"
import { useRouter } from "next/router"
import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
} from "react"
import { fetcher } from "./fetcher"
import { logger } from "./logger"
import {
  getSessionStorageItem,
  parseCookies,
  removeSessionStorageItem,
  setSessionStorageItem,
} from "./utils"

export const LOADING_STATUS = "0"
export const AUTHENTICATED = "1"
export const UNAUTHENTICATED = "2"
export type SessionStatus =
  | typeof LOADING_STATUS
  | typeof AUTHENTICATED
  | typeof UNAUTHENTICATED

export type ReqPromise = {
  resolve(value: string): void
  reject(reason?: unknown): void
}

let reqInterceptor: number
let reqQueue: ReqPromise[] = []
let isRefreshingToken = false
let accessToken: string
let accessTokenExpiredAt: number
let hasRetrievedInitialAccessToken = false

export const SESSION_STATUS_STORAGE_KEY = "sessionStatus"

/**
 * Logs user in.
 *
 * @param newAccessToken The newly obtained access token.
 * @param newAccessTokenExpiredAt The expiration timestamp of the access token.
 */
function putAuthenticated(
  newAccessToken: string,
  newAccessTokenExpiredAt: number
): void {
  accessToken = newAccessToken
  accessTokenExpiredAt = newAccessTokenExpiredAt
  setSessionStorageItem(SESSION_STATUS_STORAGE_KEY, AUTHENTICATED)
}

/**
 * Logs user out.
 */
function putUnauthenticated(): void {
  accessToken = undefined
  accessTokenExpiredAt = undefined
  setSessionStorageItem(SESSION_STATUS_STORAGE_KEY, UNAUTHENTICATED)
}

function attachTokenToRequest(config: AxiosRequestConfig, token: string) {
  // eslint-disable-next-line no-param-reassign, dot-notation
  config.headers["Authorization"] = `Bearer ${token}`
  logger.debug(`Attached access token to request ${token}`)
}

function pushRequestToQueue(prom: ReqPromise) {
  reqQueue = [...reqQueue, prom]

  logger.debug(`Pushed to request queue (length ${reqQueue.length})`)
}

function processRequestQueue(error, token: string) {
  reqQueue.forEach((prom) => {
    if (error) {
      prom.reject(error)
    } else {
      prom.resolve(token)
    }
  })

  logger.debug(`Processed request queue (length ${reqQueue.length})`)

  reqQueue = []
}

export type ExchangeTokenReturn = {
  refreshToken: string
  accessToken: string
  accessTokenExpiredAt: string
}

/**
 * Exchanges a valid refresh token for a new pair of refresh and access tokens.
 *
 * @param config? Request config that is passed to Axios.
 * @returns Axios promise.
 */
function exchangeRefreshToken(
  config?: AxiosRequestConfig
): Promise<AxiosResponse<ExchangeTokenReturn>> {
  return fetcher.post<ExchangeTokenReturn>(
    "/oauth/token",
    { grantType: "refresh_token" },
    config
  )
}

async function getInitialAccessToken() {
  try {
    const resp = await exchangeRefreshToken()

    if (!resp.data) return
    if (typeof resp.data.accessToken !== "string") return
    if (typeof resp.data.accessTokenExpiredAt !== "number") return

    hasRetrievedInitialAccessToken = true
    putAuthenticated(resp.data.accessToken, resp.data.accessTokenExpiredAt)
    logger.debug("Retrieved initial access token")
  } catch (err) {
    putUnauthenticated()
    logger.debug("Unable to retrieve initial access token")
  }
}

if (typeof window !== "undefined") {
  window.addEventListener("storage", (storageEvent) => {
    if (hasRetrievedInitialAccessToken) return
    if (storageEvent.storageArea !== sessionStorage) return
    if (storageEvent.key !== SESSION_STATUS_STORAGE_KEY) return
    if (storageEvent.newValue !== LOADING_STATUS) return

    getInitialAccessToken()
  })
}

// Prevent requestInterceptor getting attached multiple times.
// More info, https://github.com/showzyl/my-blog/issues/17
if (reqInterceptor || reqInterceptor === 0) {
  fetcher.interceptors.request.eject(reqInterceptor)
  logger.debug("Ejected request interceptor")
}

// Attaches access token to request and optionally refreshes access token if
// needed.
function interceptRequest(config: AxiosRequestConfig) {
  if (config.url !== "/graph") return config
  if (!accessToken) return config

  const sessionStatus = sessionStorage.getItem(SESSION_STATUS_STORAGE_KEY)
  if (!sessionStatus) return config
  if (sessionStatus !== AUTHENTICATED) return config

  const currentDt = Math.floor(Date.now() / 1000)
  if (accessTokenExpiredAt && currentDt < accessTokenExpiredAt) {
    attachTokenToRequest(config, accessToken)

    return config
  }

  if (isRefreshingToken) {
    return new Promise<string>((resolve, reject) => {
      // Note that the promise is not yet resolved nor rejected. The promise is
      // getting pushed to queue waiting to be completed by `processRequestQueue`.
      pushRequestToQueue({ resolve, reject })
    })
      .then((newAccessToken) => {
        attachTokenToRequest(config, newAccessToken)

        return Promise.resolve(config)
      })
      .catch((err) => Promise.reject(err))
  }

  isRefreshingToken = true

  return new Promise((resolve, reject) => {
    exchangeRefreshToken()
      .then((resp) => {
        if (
          resp.data &&
          typeof resp.data.accessToken === "string" &&
          typeof resp.data.accessTokenExpiredAt === "number"
        ) {
          const newAccessToken = resp.data.accessToken
          putAuthenticated(newAccessToken, resp.data.accessTokenExpiredAt)
          processRequestQueue(null, newAccessToken)
          attachTokenToRequest(config, newAccessToken)

          return resolve(config)
        }

        // FIXME what should the reason?
        return reject()
      })
      .catch((err) => {
        putUnauthenticated()
        processRequestQueue(err, null)

        return reject(err)
      })
      .finally(() => {
        isRefreshingToken = false
      })
  })
}

reqInterceptor = fetcher.interceptors.request.use(interceptRequest)

export type SessionContextProps = {
  status: SessionStatus
}

const SessionContext = createContext<SessionContextProps>(undefined)

export type SessionProviderProps = {
  initialStatus: SessionStatus
  children: React.ReactNode
}

function SessionProvider(props: SessionProviderProps): JSX.Element {
  const { initialStatus, children } = props
  const [status, setStatus] = useState<SessionStatus>(initialStatus)

  useEffect(() => {
    // In case the page gets reloaded, login status won't be staled.
    removeSessionStorageItem(SESSION_STATUS_STORAGE_KEY)

    setSessionStorageItem(SESSION_STATUS_STORAGE_KEY, initialStatus)
    logger.debug(`Set initial loginStatus:${initialStatus}`)

    // We don't need to care about subsequent changes to `initialLoginStatus`.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  useEffect(() => {
    window.addEventListener("storage", (storageEvent) => {
      if (storageEvent.storageArea !== sessionStorage) return
      if (storageEvent.key !== SESSION_STATUS_STORAGE_KEY) return

      setStatus(storageEvent.newValue as SessionStatus)
    })
  }, [])

  // TODO wtf is this eslint error???
  return (
    <SessionContext.Provider value={{ status }}>
      {children}
    </SessionContext.Provider>
  )
}

export type LoginWithTokenReturn = {
  emailAddress: string
}

export type VerifyLoginTokenReturn = {
  refreshToken: string
  accessToken: string
  accessTokenExpiredAt: number
}

export type VerifyGoogleIdTokenReturn = {
  refreshToken: string
  accessToken: string
  accessTokenExpiredAt: number
}

export type UseSessionProps = {
  required?: boolean
}

export type UseSessionReturn = SessionContextProps & {
  loginWithToken(
    emailAddress: string
  ): Promise<AxiosResponse<LoginWithTokenReturn>>
  verifyLoginToken(
    token: string
  ): Promise<AxiosResponse<VerifyLoginTokenReturn>>
  verifyGoogleIdToken(
    token: string
  ): Promise<AxiosResponse<VerifyGoogleIdTokenReturn>>
  logout(): Promise<AxiosResponse>
}

function useSession(props: UseSessionProps = {}): UseSessionReturn {
  const { required = false } = props
  const sessionContext = useContext(SessionContext)
  const router = useRouter()

  if (sessionContext === undefined) {
    throw new Error(`useSession must be used within a SessionProvider.`)
  }

  const { status } = sessionContext

  useEffect(() => {
    if (required && status === UNAUTHENTICATED) {
      const { publicRuntimeConfig } = getConfig()

      router.push(
        `${publicRuntimeConfig.loginUrl}?redirect=${encodeURIComponent(
          router.pathname
        )}`
      )
    }
  }, [required, status, router])

  const loginWithToken = useCallback(
    (emailAddress: string) => {
      if (status === UNAUTHENTICATED) {
        return fetcher.post<LoginWithTokenReturn>("/oauth/authorize", {
          responseType: "login_token",
          emailAddress,
        })
      }

      return Promise.reject(new Error("Already logged in."))
    },
    [status]
  )

  const verifyLoginToken = useCallback(
    (loginToken: string) => {
      if (status === UNAUTHENTICATED) {
        return fetcher.post<VerifyLoginTokenReturn>("/oauth/token", {
          grantType: "login_token",
          loginToken,
        })
      }

      return Promise.reject(new Error("Already logged in."))
    },
    [status]
  )

  const verifyGoogleIdToken = useCallback(
    (googleIdToken: string) => {
      if (status === UNAUTHENTICATED) {
        return fetcher.post<VerifyLoginTokenReturn>("/oauth/token", {
          grantType: "google_id_token",
          googleIdToken,
        })
      }

      return Promise.reject(new Error("Already logged in."))
    },
    [status]
  )

  const logout = useCallback(() => {
    if (status === AUTHENTICATED) {
      return fetcher.post("/oauth/revoke")
    }

    return null
  }, [status])

  return {
    ...sessionContext,
    loginWithToken,
    verifyLoginToken,
    verifyGoogleIdToken,
    logout,
  }
}

export type GetSessionReturn = Pick<
  ExchangeTokenReturn,
  "accessToken" | "refreshToken"
>

async function getSession(
  ctx: GetServerSidePropsContext
): Promise<GetSessionReturn> {
  const cookies = parseCookies(ctx)

  if (!cookies.refresh_token) return null

  try {
    const { data } = await exchangeRefreshToken({
      headers: { Cookie: `refresh_token=${cookies.refresh_token};` },
    })

    return { accessToken: data.accessToken, refreshToken: data.refreshToken }
  } catch (err) {
    // When `exchangeRefreshToken` is unable to retrieve a new access token,
    // just return null here.
    return null
  }
}

function setRefreshTokenCookie(
  ctx: GetServerSidePropsContext,
  refreshToken: string
): void {
  const refreshTokenCookie = cookie.serialize("refresh_token", refreshToken, {
    domain: process.env.NODE_ENV === "development" ? "localhost" : "nomdoc.com",
    path: "/",
    maxAge: 30 * 24 * 60 * 60, // 30 days
    httpOnly: true,
    secure: true,
    sameSite: "strict",
  })

  ctx.res.setHeader("set-cookie", [refreshTokenCookie])
}

function getStatusFromStorage(
  ctx: NextPageContext | GetServerSidePropsContext
): SessionStatus {
  if (ctx.req) {
    const cookies = parseCookies(ctx)

    if (cookies.refresh_token) {
      return LOADING_STATUS
    }

    return UNAUTHENTICATED
  }

  return (
    (getSessionStorageItem(SESSION_STATUS_STORAGE_KEY) as SessionStatus) ||
    UNAUTHENTICATED
  )
}

export {
  SessionProvider,
  useSession,
  getSession,
  putAuthenticated,
  putUnauthenticated,
  setRefreshTokenCookie,
  getStatusFromStorage,
}
