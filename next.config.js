module.exports = {
  poweredByHeader: false,
  reactStrictMode: true,
  serverRuntimeConfig: {},
  publicRuntimeConfig: {
    homeUrl: "/jobs",
    loginUrl: "/login",
    dashboardDefaultUrl: "/manage/jobs",
    dashboardWelcomeUrl: "/manage/welcome",
    maxPaymentMethodCount: 3,
    apiBaseUrl: process.env.API_BASE_URL,
    googleSignInSdkUrl: process.env.GOOGLE_SIGN_IN_SDK_URL,
    googleOauthClientId: process.env.GOOGLE_OAUTH_CLIENT_ID,
    googleMapsApiUrl: process.env.GOOGLE_MAPS_API_URL,
    googleMapsApiKey: process.env.GOOGLE_MAPS_API_KEY,
    stripePublicKey: process.env.STRIPE_PUBLIC_KEY,
  },
  async redirects() {
    return [
      {
        source: "/",
        destination: "/jobs?tab=open",
        permanent: false,
      },
      {
        source: "/about-us",
        destination: "/about",
        permanent: false,
      },
      {
        source: "/contact-us",
        destination: "/contact",
        permanent: false,
      },
    ]
  },
}
