import { css, StyleSheet } from "aphrodite";
import gql from "graphql-tag";
import Dialog from "material-ui/Dialog";
import RaisedButton from "material-ui/RaisedButton";
import PropTypes from "prop-types";
import queryString from "query-string";
import React from "react";
import Form from "react-formal";
import * as yup from "yup";

import GSForm from "../components/forms/GSForm";
import GSSubmitButton from "../components/forms/GSSubmitButton";
import { dataTest } from "../lib/attributes";
import { loadData } from "./hoc/with-operations";

export const UserEditMode = Object.freeze({
  SignUp: "signup",
  Login: "login",
  Change: "change",
  Reset: "reset",
  EmailReset: "email-reset",
  Edit: "edit"
});

const styles = StyleSheet.create({
  buttons: {
    display: "flex"
  },
  container: {
    display: "inline-block",
    marginRight: 20,
    marginTop: 15
  }
});

class UserEdit extends React.Component {
  state = {
    user: {},
    changePasswordDialog: false,
    successDialog: false
  };

  componentDidMount() {
    if (this.props.authType === UserEditMode.Edit) {
      this.props.mutations.editUser(null).then(({ data }) => {
        this.setState({ user: data.editUser });
      });
    }
  }

  handleSave = async (formData) => {
    switch (this.props.authType) {
      case UserEditMode.Edit: {
        const result = await this.props.mutations.editUser(formData);
        this.setState({ user: result.data.editUser });
        if (this.props.onRequestClose) {
          this.props.onRequestClose();
        }
        break;
      }
      case UserEditMode.Change:
        {
          const changeRes = await this.props.mutations.changeUserPassword(
            formData
          );
          if (changeRes.errors) {
            throw new Error(changeRes.errors.graphQLErrors[0].message);
          }
        }
        break;

      case UserEditMode.EmailReset:
        {
          const body = {
            token: queryString.parse(window.location.search).token,
            ...formData
          };
          const res = await fetch(`/auth/claim-reset`, {
            method: "POST",
            body: JSON.stringify(body),
            headers: { "Content-Type": "application/json" }
          });

          if (res.status === 400) {
            throw new Error(await res.text());
          }

          this.setState({ successDialog: true });
        }
        break;

      default: {
        // log in, sign up, or reset
        const allData = {
          nextUrl: this.props.nextUrl || "/",
          authType: this.props.authType,
          ...formData
        };
        const loginRes = await fetch("/login-callback", {
          method: "POST",
          body: JSON.stringify(allData),
          headers: { "Content-Type": "application/json" }
        });
        const { redirected, headers, status, url } = loginRes;
        if (redirected && status === 200) {
          window.location = url;
        } else if (status === 401) {
          throw new Error(headers.get("www-authenticate") || "");
        } else if (status === 400) {
          const body = await loginRes.json();
          throw new Error(body.message);
        } else {
          const body = await loginRes.text();
          throw new Error(`Unknown error:\n\n${body}`);
        }
        break;
      }
    }
  };

  handleClick = () => this.setState({ changePasswordDialog: true });

  handleClose = () => {
    if (this.props.authType === UserEditMode.EmailReset) {
      window.history.href = "/login";
    }
    this.setState({ changePasswordDialog: false, successDialog: false });
  };

  openSuccessDialog = () => this.setState({ successDialog: true });

  buildFormSchema = (authType) => {
    const email = yup.string().email().required();
    const userFields = {
      firstName: yup.string().required(),
      lastName: yup.string().required(),
      cell: yup.string().required()
    };
    const password = yup.string().required();
    const passwordConfirm = (refField = "password") =>
      yup
        .string()
        .oneOf([yup.ref(refField)], "Passwords must match")
        .required();

    switch (authType) {
      case UserEditMode.Login:
        // Handled by passport at /login-callback
        return yup.object({
          email,
          password
        });
      case UserEditMode.SignUp:
        // Handled by passport at /login-callback
        return yup.object({
          email,
          password,
          passwordConfirm: passwordConfirm("password"),
          ...userFields
        });
      case UserEditMode.Reset:
        // Handled by passport at /login-callback (thus why `email` is required)
        return yup.object({
          email,
          password,
          passwordConfirm: passwordConfirm("password")
        });
      case UserEditMode.EmailReset:
        // Handled by custom handler at /auth/claim-reset
        return yup.object({
          // hidden token from url path
          password,
          passwordConfirm: passwordConfirm("password")
        });
      case UserEditMode.Edit:
        // Handled by editUser mutation
        return yup.object({
          email,
          ...userFields
        });
      case UserEditMode.Change:
        // Handled by changeUserPassword mutation
        return yup.object({
          password,
          newPassword: yup.string().required(),
          passwordConfirm: passwordConfirm("newPassword")
        });
      // no default
    }
  };

  render() {
    // Data may be `undefined` here due to refetch in child UserEdit component in change password dialog
    const { authType, style, userId, data, saveLabel } = this.props;
    const { user } = this.state;

    const formSchema = this.buildFormSchema(authType);
    const isLocalAuth = window.PASSPORT_STRATEGY === "local";
    const isCurrentUser = userId && data && userId === data.currentUser.id;
    const isAlreadyChangePassword = authType === UserEditMode.Change;
    const canChangePassword =
      isLocalAuth && isCurrentUser && !isAlreadyChangePassword;

    return (
      <div>
        <GSForm
          schema={formSchema}
          onSubmit={this.handleSave}
          defaultValue={user}
          className={style}
        >
          {(authType === UserEditMode.Login ||
            authType === UserEditMode.SignUp ||
            authType === UserEditMode.Reset ||
            authType === UserEditMode.Edit) && (
            <Form.Field
              label="Email"
              name="email"
              disabled={!isLocalAuth}
              {...dataTest("email")}
            />
          )}
          {(authType === UserEditMode.SignUp ||
            authType === UserEditMode.Edit) && (
            <span>
              <Form.Field
                label="First name"
                name="firstName"
                {...dataTest("firstName")}
              />
              <Form.Field
                label="Last name"
                name="lastName"
                {...dataTest("lastName")}
              />
              <Form.Field
                label="Cell Number"
                name="cell"
                {...dataTest("cell")}
              />
            </span>
          )}
          {(authType === UserEditMode.Login ||
            authType === UserEditMode.SignUp ||
            authType === UserEditMode.Reset ||
            authType === UserEditMode.EmailReset ||
            authType === UserEditMode.Change) && (
            <Form.Field label="Password" name="password" type="password" />
          )}
          {authType === UserEditMode.Change && (
            <Form.Field
              label="New Password"
              name="newPassword"
              type="password"
            />
          )}
          {(authType === UserEditMode.SignUp ||
            authType === UserEditMode.Reset ||
            authType === UserEditMode.EmailReset ||
            authType === UserEditMode.Change) && (
            <Form.Field
              label="Confirm Password"
              name="passwordConfirm"
              type="password"
            />
          )}
          <div className={css(styles.buttons)}>
            {canChangePassword && (
              <div className={css(styles.container)}>
                <RaisedButton
                  onTouchTap={this.handleClick}
                  label="Change password"
                  variant="outlined"
                />
              </div>
            )}
            <Form.Button
              type="submit"
              label={saveLabel || "Save"}
              component={GSSubmitButton}
            />
          </div>
        </GSForm>
        <div>
          <Dialog
            {...dataTest("changePasswordDialog")}
            title="Change your password"
            modal={false}
            open={this.state.changePasswordDialog}
            onRequestClose={this.handleClose}
          >
            <UserEdit
              authType={UserEditMode.Change}
              saveLabel="Save new password"
              handleClose={this.handleClose}
              openSuccessDialog={this.openSuccessDialog}
              userId={this.props.userId}
              mutations={this.props.mutations}
            />
          </Dialog>
          <Dialog
            {...dataTest("successPasswordDialog")}
            title="Password changed successfully!"
            modal={false}
            open={this.state.successDialog}
            onRequestClose={this.handleClose}
            onBackdropClick={this.handleClose}
            onEscapeKeyDown={this.handleClose}
          >
            <RaisedButton onTouchTap={this.handleClose} label="OK" primary />
          </Dialog>
        </div>
      </div>
    );
  }
}

UserEdit.defaultProps = {
  authType: UserEditMode.Edit
};

UserEdit.propTypes = {
  organizationId: PropTypes.string.isRequired,
  userId: PropTypes.string.isRequired,
  saveLabel: PropTypes.string,
  nextUrl: PropTypes.string,
  authType: PropTypes.string,
  style: PropTypes.string,
  onRequestClose: PropTypes.func,

  // HOC props
  data: PropTypes.object.isRequired,
  mutations: PropTypes.shape({
    editUser: PropTypes.func.isRequired,
    changeUserPassword: PropTypes.func.isRequired
  })
};

const queries = {
  data: {
    query: gql`
      query getCurrentUser {
        currentUser {
          id
        }
      }
    `
  }
};

const mutations = {
  editUser: (ownProps) => (userData) => ({
    mutation: gql`
      mutation editUser(
        $organizationId: String!
        $userId: Int!
        $userData: UserInput
      ) {
        editUser(
          organizationId: $organizationId
          userId: $userId
          userData: $userData
        ) {
          id
          firstName
          lastName
          cell
          email
        }
      }
    `,
    variables: {
      userId: ownProps.userId,
      organizationId: ownProps.organizationId,
      userData
    }
  }),
  changeUserPassword: (ownProps) => (formData) => ({
    mutation: gql`
      mutation changeUserPassword(
        $userId: Int!
        $formData: UserPasswordChange
      ) {
        changeUserPassword(userId: $userId, formData: $formData) {
          id
        }
      }
    `,
    variables: {
      userId: ownProps.userId,
      formData
    }
  })
};

export default loadData({
  queries,
  mutations
})(UserEdit);
