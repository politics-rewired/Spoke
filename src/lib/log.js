import minilog from 'minilog'
import { isClient } from './is-client'
const Rollbar = require('rollbar')
let rollbar = undefined
let logInstance = null

if (isClient()) {
  minilog.enable()
  logInstance = minilog('client')
  const existingErrorLogger = logInstance.error
  logInstance.error = (...err) => {
    const errObj = err
    if (window.rollbar) {
        window.rollbar.init({
          accessToken: window.ROLLBAR_CLIENT_TOKEN,
          // enabled: ${process.env.NODE_ENV === 'production'},
          enabled: true,
          captureUncaught: true,
          captureUnhandledRejections: true,
          payload: {
            environment: 'production'
          }
        })
      // console.log(window.rollbar)
      window.rollbar.error(...errObj)
    }
    existingErrorLogger.call(...errObj)
  }
} else {
  let enableRollbar = false
  if (process.env.NODE_ENV === 'production' && process.env.ROLLBAR_ACCESS_TOKEN) {
    enableRollbar = true
    rollbar = new Rollbar({
      accessToken: process.env.ROLLBAR_ACCESS_TOKEN,
      captureUncaught: true,
      captureUnhandledRejections: true
    })
  }

  minilog.suggest.deny(/.*/, process.env.NODE_ENV === 'development' ? 'debug' : 'debug')

  minilog.enable()
    .pipe(minilog.backends.console.formatWithStack)
    .pipe(minilog.backends.console)

  logInstance = minilog('backend')
  const existingErrorLogger = logInstance.error
  logInstance.error = (...err) => {
    if (enableRollbar) {
      if (typeof err === 'object') {
        rollbar.error(...err)
      } else if (typeof err === 'string') {
        rollbar.critical(...err)
      } else {
        rollbar.error('Got backend error with no error message')
      }
    }

    if (err[0] && err[0].stack) {
      existingErrorLogger(err[0].stack)
    } else {
      existingErrorLogger(...err)
    }
  }
}

const log = (process.env.LAMBDA_DEBUG_LOG ? console : logInstance)

export { log }
