import pino from "pino"

// TODO config for production
const logger = pino({
  browser: {
    asObject: true,
  },
  level: "debug",
})

export { logger }
