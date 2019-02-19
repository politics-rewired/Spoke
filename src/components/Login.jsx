import PropTypes from 'prop-types'
import React from 'react'
import { isClient } from '../lib'

const Login = ({ location }) => (
  <div>
    {window.PASSPORT_STRATEGY == 'slack' 
      // If Slack strategy, the server needs to initiate the redirect
      // Force reload will hit the server redirect (as opposed to client routing)
      ? window.location.href = 'https://www.bernietext.com/auth/login/slack/'
      : isClient() ? window.AuthService.login(location.query.nextUrl) : ''
    }
  </div>
)

Login.propTypes = {
  location: PropTypes.object
}

export default Login
