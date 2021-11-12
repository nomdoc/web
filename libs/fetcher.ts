import axios, { AxiosRequestConfig } from "axios"
import getConfig from "next/config"

const { publicRuntimeConfig } = getConfig()

const fetcher = axios.create({
  baseURL: publicRuntimeConfig.apiBaseUrl,
  responseType: "json",
  withCredentials: true,
})

export type GraphErrorLocation = {
  column: number
  line: number
}

export type GraphError = {
  code: string
  location: GraphErrorLocation[]
  message: string
  path: string[]
  status_code: string
}

export type GraphResponse<T, S extends GraphError[] = []> = {
  data: T
  errors: S
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function queryGraph<T, S = Record<string, any>>(
  query: string,
  variables?: S,
  requestConfig?: AxiosRequestConfig
): Promise<T> {
  const result = await fetcher.post<GraphResponse<T>>(
    "/graph",
    { query, variables },
    requestConfig
  )

  if (result.data.errors) {
    throw result.data.errors
  }

  return result.data.data
}

export { fetcher, queryGraph }
