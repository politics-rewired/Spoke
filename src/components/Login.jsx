import PropTypes from "prop-types";
import React from "react";
import { isClient } from "../lib";
import UserEdit from "../containers/UserEdit";

const LocalLogin = ({ location }) => (
  <div>
    <form action="/login-callback" method="POST">
      <input type="hidden" name="nextUrl" value={location.query.nextUrl} />
      <div>
        <label>email:</label>
        <input type="text" name="email" />
        <br />
      </div>
      <div>
        <label>Password:</label>
        <input type="password" name="password" />
      </div>
      <div>
        <input type="submit" value="Submit" />
      </div>
    </form>
    <UserEdit />
  </div>
);

const Login = ({ location }) => {
  switch (window.PASSPORT_STRATEGY) {
    case "slack":
      // If Slack strategy, the server needs to initiate the redirect
      // Force reload will hit the server redirect (as opposed to client routing)
      return (window.location.href =
        "https://www.bernietext.com/auth/login/slack/");

    case "local":
      return <LocalLogin location={location} />;

    default:
      return isClient() ? window.AuthService.login(location.query.nextUrl) : "";
  }
};

Login.propTypes = {
  location: PropTypes.object.isRequired
};

export default Login;
