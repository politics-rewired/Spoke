import PropTypes from "prop-types";
import React from "react";
import { withRouter } from "react-router";
import { StyleSheet, css } from "aphrodite";

import { isClient } from "../lib";
import theme from "../styles/theme";
import UserEdit from "../containers/UserEdit";

const styles = StyleSheet.create({
  fieldContainer: {
    background: theme.colors.white,
    padding: "15px",
    width: "256px"
  },
  loginPage: {
    display: "flex",
    "justify-content": "center",
    "align-items": "flex-start",
    height: "100vh",
    "padding-top": "10vh",
    background: theme.colors.veryLightGray
  },
  button: {
    border: "none",
    background: theme.colors.lightGray,
    color: theme.colors.darkGreen,
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

class LocalLogin extends React.Component {
  state = {
    active: "login"
  };

  componentDidMount = () => {
    const { nextUrl } = this.props.location.query;
    if (!this.naiveVerifyInviteValid(nextUrl)) {
      this.props.router.replace("/login");
    }
    if (nextUrl && nextUrl.includes("reset")) {
      this.setState({ active: "reset" });
    }
  };

  handleClick = e => {
    this.setState({ active: e.target.name });
  };

  naiveVerifyInviteValid = nextUrl =>
    /\/\w{8}-(\w{4}\-){3}\w{12}(\/|$)/.test(nextUrl);

  render() {
    const { location, router } = this.props;
    const { nextUrl } = location.query;
    const { active } = this.state;

    // If nextUrl is a valid (naive RegEx only) invite or organization
    // UUID display Sign Up section. Full validation done on backend.
    const inviteLink =
      nextUrl && (nextUrl.includes("join") || nextUrl.includes("invite"));
    const displaySignUp = inviteLink && this.naiveVerifyInviteValid(nextUrl);

    const saveLabels = {
      login: "Log In",
      signup: "Sign Up",
      reset: "Save New Password"
    };

    return (
      <div className={css(styles.loginPage)}>
        {/* Only display sign up option if there is a nextUrl */}
        {displaySignUp && (
          <section>
            <button
              className={css(styles.button)}
              type="button"
              name="login"
              onClick={this.handleClick}
              disabled={active === "login"}
            >
              Log In
            </button>
            <button
              className={css(styles.button)}
              type="button"
              name="signup"
              onClick={this.handleClick}
              disabled={active === "signup"}
            >
              Sign Up
            </button>
          </section>
        )}
        <div className={css(styles.fieldContainer)}>
          <h2 className={css(styles.header)}>Welcome to Spoke</h2>
          <UserEdit
            authType={active}
            saveLabel={saveLabels[active]}
            router={router}
            nextUrl={nextUrl}
            style={css(styles.authFields)}
          />
        </div>
      </div>
    );
  }
}

LocalLogin.propTypes = {
  location: PropTypes.object.isRequired,
  router: PropTypes.object.isRequired
};

const LocalLoginWrapper = withRouter(LocalLogin);

const Login = ({ location }) => {
  switch (window.PASSPORT_STRATEGY) {
    case "slack":
      // If Slack strategy, the server needs to initiate the redirect
      // Force reload will hit the server redirect (as opposed to client routing)
      return (window.location.href =
        "https://www.bernietext.com/auth/login/slack/");

    case "local":
      return <LocalLoginWrapper location={location} />;

    default:
      return isClient() ? window.AuthService.login(location.query.nextUrl) : "";
  }
};

Login.propTypes = {
  location: PropTypes.object.isRequired
};

export default Login;
