import cookie from "cookie"
import minimatch from "minimatch"
import { GetServerSidePropsContext, NextPageContext } from "next"
import { logger } from "./logger"

function globMatch(patterns: string[], value: string): boolean {
  return patterns.some((pattern) => minimatch(value, pattern))
}

// eslint-disable-next-line @typescript-eslint/ban-types
function isFunction(value: unknown): value is Function {
  return !!(value && {}.toString.call(value) === "[object Function]")
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function isObject(value: any) {
  return typeof value === "object" && !Array.isArray(value) && value !== null
}

function parseCookies(
  ctx: NextPageContext | GetServerSidePropsContext
): Record<string, string> {
  return cookie.parse(ctx.req ? ctx.req.headers.cookie || "" : document.cookie)
}

function setSessionStorageItem(key: string, value: string): void {
  if (typeof window !== "undefined") {
    const oldValue = window.sessionStorage.getItem(key)

    if (oldValue === value) return

    window.sessionStorage.setItem(key, value)

    // StorageEvent is fired in different page with the same domain.
    // More info, https://stackoverflow.com/a/65348883
    window.dispatchEvent(
      new StorageEvent("storage", {
        key,
        newValue: value,
        oldValue,
        storageArea: sessionStorage,
      })
    )

    logger.debug(`Set session storage item ${key}:${value}`)
  }
}

function removeSessionStorageItem(key: string): void {
  if (typeof window !== "undefined") {
    window.sessionStorage.removeItem(key)
    logger.debug(`Removed session storage item ${key}`)
  }
}

function getSessionStorageItem(key: string): string | null | undefined {
  if (typeof window !== "undefined") {
    return window.sessionStorage.getItem(key)
  }

  return undefined
}

function emailAddressRegex() {
  // Copied from https://github.com/segmentio/is-email/blob/master/lib/index.js#L4
  return /^[a-zA-Z0-9.!#$%&'*+\/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*$/
}

export {
  getSessionStorageItem,
  globMatch,
  isFunction,
  isObject,
  parseCookies,
  removeSessionStorageItem,
  setSessionStorageItem,
  emailAddressRegex,
}
