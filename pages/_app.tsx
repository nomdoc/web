import { DEFAULT_ICON_CONFIGS, IconProvider } from "@icon-park/react"
import { Elements as StripeElements } from "@stripe/react-stripe-js"
import { loadStripe } from "@stripe/stripe-js"
import App, { AppContext, AppInitialProps } from "next/app"
import getConfig from "next/config"
import Head from "next/head"
import React from "react"
import "tailwindcss/tailwind.css"
import {
  getStatusFromStorage as getSessionStatusFromStorage,
  SessionProvider,
} from "../libs/session"
import "../styles/global.css"

const IconConfig = { ...DEFAULT_ICON_CONFIGS, prefix: "nomdoc" }

const { publicRuntimeConfig } = getConfig()
const stripePromise = loadStripe(publicRuntimeConfig.stripePublicKey)

export default class CustomApp extends App {
  // In case you're wondering why `getInitialProps` does not run on client side
  // sometimes, here's an excerpt from https://nextjs.org/docs/api-reference/data-fetching/getInitialProps
  //
  // For the initial page load, `getInitialProps` will run on the server only.
  // `getInitialProps` will then run on the client when navigating to a different
  // route via the `next/link` component or by using `next/router`. However, if
  // `getInitialProps` is used in a custom `_app.js`, and the page being navigated
  // to implements `getServerSideProps`, then `getInitialProps` will run on the
  // server.
  static async getInitialProps(appCtx: AppContext): Promise<AppInitialProps> {
    const { ctx } = appCtx

    const props = await App.getInitialProps(appCtx)

    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-ignore
    return { ...props, sessionStatus: getSessionStatusFromStorage(ctx) }
  }

  render(): JSX.Element {
    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-ignore
    const { Component, pageProps, sessionStatus } = this.props

    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-ignore
    const getLayout = Component.getLayout || ((page) => page)
    const AppWithLayout = getLayout(<Component {...pageProps} />)

    return (
      <>
        <Head>
          <title>Nomdoc</title>
          <meta charSet="utf-8" />
          <meta httpEquiv="X-UA-Compatible" content="IE=edge" />
          <meta
            name="viewport"
            content="width=device-width,initial-scale=1,minimum-scale=1"
          />
          <meta name="description" content="Description" />
          <meta name="keywords" content="Keywords" />
          <meta name="theme-color" content="#317EFB" />
          <link rel="manifest" href="/manifest.json" />
          <link
            rel="icon"
            href="/favicon/favicon-16x16.png"
            type="image/png"
            sizes="16x16"
          />
          <link
            rel="icon"
            href="/favicon/favicon-32x32.png"
            type="image/png"
            sizes="32x32"
          />
          <link rel="apple-touch-icon" href="/apple-icon.png" />
        </Head>
        <StripeElements stripe={stripePromise}>
          <IconProvider value={IconConfig}>
            <SessionProvider initialStatus={sessionStatus}>
              {AppWithLayout}
            </SessionProvider>
          </IconProvider>
        </StripeElements>
      </>
    )
  }
}
