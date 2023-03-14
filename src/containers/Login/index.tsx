import { css, StyleSheet } from "aphrodite/no-important";
import muiThemeable from "material-ui/styles/muiThemeable";
import queryString from "query-string";
import React from "react";
import type { RouteChildrenProps } from "react-router-dom";
import { withRouter } from "react-router-dom";
import { compose } from "recompose";

import theme from "../../styles/theme";
import type { MuiThemeProviderProps } from "../../styles/types";
import UserEdit, { UserEditMode } from "../UserEdit";
import UserPasswordReset from "./components/UserPasswordReset";

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
    "text-align": "center",
    "margin-bottom": 0
  }
});

const saveLabels: Record<string, string> = {
  [UserEditMode.SignUp]: "Sign Up",
  [UserEditMode.Login]: "Log In",
  [UserEditMode.Reset]: "Save New Password",
  [UserEditMode.RequestReset]: "Request Reset"
};

type LogalLoginProps = RouteChildrenProps & MuiThemeProviderProps;

interface LogalLoginState {
  active: string;
}

class LocalLogin extends React.Component<LogalLoginProps, LogalLoginState> {
  constructor(props: LogalLoginProps) {
    super(props);

    const nextUrl = queryString.parse(window.location.search).nextUrl || "/";
    this.state = {
      active: nextUrl.includes("reset")
        ? UserEditMode.Reset
        : window.location.pathname.includes("email-reset")
        ? UserEditMode.EmailReset
        : UserEditMode.Login
    };
  }

  handleClick = (e: React.MouseEvent<HTMLButtonElement, MouseEvent>) => {
    this.setState({ active: e.currentTarget.name });
  };

  naiveVerifyInviteValid = (nextUrl: string) =>
    /\/\w{8}-(\w{4}-){3}\w{12}(\/|$)/.test(nextUrl) ||
    nextUrl.includes("invite");

  render() {
    const { location, history, muiTheme } = this.props;
    const rawNextUrl = queryString.parse(location.search).nextUrl;
    const nextUrl =
      (Array.isArray(rawNextUrl) ? rawNextUrl[0] : rawNextUrl) || "/";
    const { active } = this.state;

    // If nextUrl is a valid (naive RegEx only) invite or organization
    // UUID display Sign Up section. Full validation done on backend.
    const inviteLink =
      nextUrl && (nextUrl.includes("join") || nextUrl.includes("invite"));
    const displaySignUp = inviteLink && this.naiveVerifyInviteValid(nextUrl);

    const headerColor = muiTheme?.palette?.primary1Color ?? theme.colors.green;

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
          <h2 className={css(styles.header)} style={{ color: headerColor }}>
            {active === UserEditMode.EmailReset
              ? "Reset Your Password"
              : active === UserEditMode.RequestReset
              ? "Request a Password Reset Email"
              : "Welcome to Spoke"}
          </h2>
          {active === UserEditMode.Reset ? (
            <UserPasswordReset history={history} nextUrl={nextUrl} />
          ) : (
            <UserEdit
              authType={active}
              saveLabel={saveLabels[active]}
              history={history}
              nextUrl={nextUrl}
              startRequestReset={() =>
                this.setState({ active: UserEditMode.RequestReset })
              }
            />
          )}
        </div>
      </div>
    );
  }
}

const LocalLoginWrapper = compose<LogalLoginProps, unknown>(
  muiThemeable(),
  withRouter
)(LocalLogin);

const Login: React.FC = () => {
  if (window.ALTERNATE_LOGIN_URL) {
    window.location.href = window.ALTERNATE_LOGIN_URL;
    return <div />;
  }
  switch (window.PASSPORT_STRATEGY) {
    case "slack":
      // If Slack strategy, the server needs to initiate the redirect
      // Force reload will hit the server redirect (as opposed to client routing)
      window.location.href = `${window.location.href}`;
      return <div />;

    case "local":
      return <LocalLoginWrapper />;

    default: {
      const { nextUrl } = queryString.parse(window.location.search);
      window.AuthService.login(nextUrl);
      return <div />;
    }
  }
};

export default Login;
