import PropTypes from "prop-types";
import React from "react";
import queryString from "query-string";
import { withRouter } from "react-router";
import { StyleSheet, css } from "aphrodite";

import theme from "../styles/theme";
import UserEdit, { UserEditMode } from "../containers/UserEdit";
import UserPasswordReset from "../components/UserPasswordReset";

const styles = StyleSheet.create({
  fieldContainer: {
    background: theme.colors.white,
    padding: "15px",
    width: "256px"
  },
  loginPage: {
    display: "flex",
    "justify-content": "center",
    "align-items": "center",
    flexDirection: "column",
    height: "100vh",
    "padding-top": "10vh",
    background: theme.colors.veryLightGray
  },
  button: {
    border: "none",
    background: theme.colors.lightGray,
    color: theme.colors.darkGreen,
    height: "100%",
    padding: "16px 16px",
    "font-size": "14px",
    "text-transform": "uppercase",
    cursor: "pointer",
    width: "50%",
    transition: "all 0.3s",
    ":disabled": {
      background: theme.colors.white,
      cursor: "default",
      color: theme.colors.green
    }
  },
  header: {
    ...theme.text.header,
    color: theme.colors.green,
    "text-align": "center",
    "margin-bottom": 0
  }
});

const saveLabels = {
  [UserEditMode.SignUp]: "Sign Up",
  [UserEditMode.Login]: "Log In",
  [UserEditMode.Reset]: "Save New Password"
};

class LocalLogin extends React.Component {
  constructor(props) {
    super(props);

    const nextUrl = queryString.parse(location.search).nextUrl || "/";
    this.state = {
      active: nextUrl.includes("reset")
        ? UserEditMode.Reset
        : UserEditMode.Login
    };
  }

  handleClick = (e) => {
    this.setState({ active: e.target.name });
  };

  naiveVerifyInviteValid = (nextUrl) =>
    /\/\w{8}-(\w{4}\-){3}\w{12}(\/|$)/.test(nextUrl) ||
    nextUrl.includes("invite");

  render() {
    const { location, history } = this.props;
    const nextUrl = queryString.parse(location.search).nextUrl || "/";
    const { active } = this.state;

    // If nextUrl is a valid (naive RegEx only) invite or organization
    // UUID display Sign Up section. Full validation done on backend.
    const inviteLink =
      nextUrl && (nextUrl.includes("join") || nextUrl.includes("invite"));
    const displaySignUp = inviteLink && this.naiveVerifyInviteValid(nextUrl);

    return (
      <div className={css(styles.loginPage)}>
        {/* Only display sign up option if there is a nextUrl */}
        {displaySignUp && (
          <section style={{ width: 256 }}>
            <button
              className={css(styles.button)}
              type="button"
              name={UserEditMode.Login}
              onClick={this.handleClick}
              disabled={active === UserEditMode.Login}
            >
              Log In
            </button>
            <button
              className={css(styles.button)}
              type="button"
              name={UserEditMode.SignUp}
              onClick={this.handleClick}
              disabled={active === UserEditMode.SignUp}
            >
              Sign Up
            </button>
          </section>
        )}
        <div className={css(styles.fieldContainer)}>
          <h2 className={css(styles.header)}>Welcome to Spoke</h2>
          {active === UserEditMode.Reset ? (
            <UserPasswordReset
              history={history}
              nextUrl={nextUrl}
              style={css(styles.authFields)}
            />
          ) : (
            <UserEdit
              authType={active}
              saveLabel={saveLabels[active]}
              history={history}
              nextUrl={nextUrl}
              style={css(styles.authFields)}
            />
          )}
        </div>
      </div>
    );
  }
}

LocalLogin.propTypes = {
  location: PropTypes.object.isRequired,
  history: PropTypes.object.isRequired
};

const LocalLoginWrapper = withRouter(LocalLogin);

const Login = ({ location, history }) => {
  if (window.ALTERNATE_LOGIN_URL) {
    window.location.href = window.ALTERNATE_LOGIN_URL;
    return <div />;
  }
  switch (window.PASSPORT_STRATEGY) {
    case "slack":
      // If Slack strategy, the server needs to initiate the redirect
      // Force reload will hit the server redirect (as opposed to client routing)
      window.location = "/login";
      return <div />;

    case "local":
      return <LocalLoginWrapper location={location} history={history} />;

    default:
      const { nextUrl } = queryString.parse(location.search);
      window.AuthService.login(nextUrl);
      return <div />;
  }
};

Login.propTypes = {
  location: PropTypes.object.isRequired,
  history: PropTypes.object.isRequired
};

export default Login;
