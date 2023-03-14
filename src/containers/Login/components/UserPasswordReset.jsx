import { css, StyleSheet } from "aphrodite";
import PropTypes from "prop-types";
import React from "react";
import Form from "react-formal";
import * as yup from "yup";

import GSForm from "../../../components/forms/GSForm";
import SpokeFormField from "../../../components/forms/SpokeFormField";
import { dataTest } from "../../../lib/attributes";
import { UserEditMode } from "../../UserEdit";

const styles = StyleSheet.create({
  buttons: {
    display: "flex"
  }
});

const formSchema = yup.object({
  email: yup.string().email().required(),
  password: yup.string().required(),
  passwordConfirm: yup
    .string()
    .oneOf([yup.ref("password")], "Passwords must match")
    .required()
});

class UserPasswordReset extends React.Component {
  state = {
    working: false,
    error: undefined
  };

  handleOnSubmit = async (formData) => {
    this.setState({ working: true, error: undefined });
    const response = await fetch("/login-callback", {
      method: "POST",
      body: JSON.stringify({
        authType: UserEditMode.Reset,
        nextUrl: this.props.nextUrl,
        ...formData
      }),
      headers: { "Content-Type": "application/json" }
    });
    this.setState({ working: false });

    const { redirected, headers, status } = response;
    if (redirected && status === 200) {
      this.props.history.push("/");
    } else if (status === 401) {
      this.setState({ error: headers.get("www-authenticate") || "" });
    } else if (status === 400) {
      const body = await response.json();
      this.setState({ error: body.message });
    } else {
      const body = await response.text();
      const message = `Unknown error:\n\n${body}`;
      this.setState({ error: message });
    }
  };

  render() {
    const { style, isEmailReset } = this.props;
    const { working, error } = this.state;
    const isLocalAuth = window.PASSPORT_STRATEGY === "local";

    return (
      <GSForm
        schema={formSchema}
        onSubmit={this.handleOnSubmit}
        className={style}
      >
        {!isEmailReset && (
          <SpokeFormField
            label="Email"
            name="email"
            disabled={!isLocalAuth}
            {...dataTest("email")}
          />
        )}
        <SpokeFormField label="Password" name="password" type="password" />
        <SpokeFormField
          label="Confirm Password"
          name="passwordConfirm"
          type="password"
        />
        <div className={css(styles.buttons)}>
          <Form.Submit
            type="submit"
            label="Save New Password"
            disabled={working}
          />
        </div>
        {error && <p>Error: {error}</p>}
      </GSForm>
    );
  }
}

UserPasswordReset.propTypes = {
  history: PropTypes.object.isRequired,
  nextUrl: PropTypes.string.isRequired,
  style: PropTypes.string
};

export default UserPasswordReset;
