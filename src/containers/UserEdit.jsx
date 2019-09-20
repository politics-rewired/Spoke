import React from "react";
import PropTypes from "prop-types";
import gql from "graphql-tag";
import * as yup from "yup";
import Form from "react-formal";
import { StyleSheet, css } from "aphrodite";
import Dialog from "material-ui/Dialog";
import RaisedButton from "material-ui/RaisedButton";

import loadData from "./hoc/load-data";
import wrapMutations from "./hoc/wrap-mutations";
import { dataTest } from "../lib/attributes";
import GSForm from "../components/forms/GSForm";

export const UserEditMode = Object.freeze({
  SignUp: "signup",
  Login: "login",
  Change: "change",
  Reset: "reset",
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
    changePasswordDialog: false,
    successDialog: false
  };

  async componentWillMount() {
    if (this.props.authType === UserEditMode.Edit) {
      await this.props.mutations.editUser(null);
    }
  }

  handleSave = async formData => {
    switch (this.props.authType) {
      case UserEditMode.Edit:
        await this.props.mutations.editUser(formData);
        if (this.props.onRequestClose) {
          this.props.onRequestClose();
        }
        break;
      case UserEditMode.Change:
        const changeRes = await this.props.mutations.changeUserPassword(
          formData
        );
        if (changeRes.errors) {
          throw new Error(changeRes.errors.graphQLErrors[0].message);
        }
        this.props.openSuccessDialog();
        break;

      default:
        // log in, sign up, or reset
        const allData = {
          nextUrl: this.props.nextUrl,
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
          this.props.router.replace(url);
        } else if (status === 401) {
          throw new Error(headers.get("www-authenticate") || "");
        }
        break;
    }
  };

  handleClick = () => this.setState({ changePasswordDialog: true });

  handleClose = () => {
    if (this.props.handleClose) {
      this.props.handleClose();
    } else {
      this.setState({ changePasswordDialog: false, successDialog: false });
    }
  };

  openSuccessDialog = () => this.setState({ successDialog: true });

  buildFormSchema = authType => {
    const email = yup
      .string()
      .email()
      .required();
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
    }
  };

  render() {
    const { authType, editUser, style, userId, data, saveLabel } = this.props;
    const user = (editUser && editUser.editUser) || {};

    const formSchema = this.buildFormSchema(authType);

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
            <Form.Field label="Email" name="email" {...dataTest("email")} />
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
            authType === UserEditMode.Change) && (
            <Form.Field
              label="Confirm Password"
              name="passwordConfirm"
              type="password"
            />
          )}
          <div className={css(styles.buttons)}>
            {authType !== UserEditMode.Change &&
              userId &&
              userId === data.currentUser.id && (
                <div className={css(styles.container)}>
                  <RaisedButton
                    onTouchTap={this.handleClick}
                    label="Change password"
                    variant="outlined"
                  />
                </div>
              )}
            <Form.Button type="submit" label={saveLabel || "Save"} />
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
  mutations: PropTypes.object.isRequired,
  data: PropTypes.object.isRequired,
  router: PropTypes.object.isRequired,
  editUser: PropTypes.object.isRequired,
  userId: PropTypes.string.isRequired,
  organizationId: PropTypes.string.isRequired,
  saveLabel: PropTypes.string.isRequired,
  nextUrl: PropTypes.string.isRequired,
  authType: PropTypes.string,
  style: PropTypes.string,
  onRequestClose: PropTypes.func.isRequired,
  handleClose: PropTypes.func.isRequired,
  openSuccessDialog: PropTypes.func.isRequired
};

const mapQueriesToProps = ({ ownProps }) => {
  if (ownProps.userId) {
    return {
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
  }
};

const mapMutationsToProps = ({ ownProps }) => {
  if (ownProps.userId) {
    return {
      editUser: userData => ({
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
      changeUserPassword: formData => ({
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
  }
};

export default loadData(wrapMutations(UserEdit), {
  mapQueriesToProps,
  mapMutationsToProps
});
