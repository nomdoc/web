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
    googleRecaptchaSdkUrl: process.env.GOOGLE_RECAPTCHA_SDK_URL,
    googleRecaptchaKeyId: process.env.GOOGLE_RECAPTCHA_KEY_ID,
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
