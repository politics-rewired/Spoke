import { gql } from "@apollo/client";
import Dialog from "@material-ui/core/Dialog";
import DialogActions from "@material-ui/core/DialogActions";
import DialogContent from "@material-ui/core/DialogContent";
import DialogTitle from "@material-ui/core/DialogTitle";
import IconButton from "@material-ui/core/IconButton";
import InputLabel from "@material-ui/core/InputLabel";
import MenuItem from "@material-ui/core/MenuItem";
import Select from "@material-ui/core/Select";
import Snackbar from "@material-ui/core/Snackbar";
import CloseIcon from "@material-ui/icons/Close";
import MuiAlert from "@material-ui/lab/Alert";
import { css, StyleSheet } from "aphrodite";
import RaisedButton from "material-ui/RaisedButton";
import PropTypes from "prop-types";
import queryString from "query-string";
import React from "react";
import Form from "react-formal";
import * as yup from "yup";

import { NotificationFrequencyType } from "../api/user";
import GSForm from "../components/forms/GSForm";
import GSSubmitButton from "../components/forms/GSSubmitButton";
import SpokeFormField from "../components/forms/SpokeFormField";
import { dataTest, titleCase } from "../lib/attributes";
import { loadData } from "./hoc/with-operations";

export const UserEditMode = Object.freeze({
  SignUp: "signup",
  Login: "login",
  Change: "change",
  Reset: "reset",
  RequestReset: "request-reset",
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
    user: {
      notificationFrequency: NotificationFrequencyType.All
    },
    changePasswordDialog: false,
    successDialog: false,
    successMessage: undefined,
    snackbarOpen: false
  };

  componentDidMount() {
    if (this.props.authType === UserEditMode.Edit) {
      this.props.mutations.editUser(null).then(({ data }) => {
        this.setState({ user: data.editUser });
      });
    }
  }

  getSnackbarText = () => {
    switch (this.state.user.notificationFrequency) {
      case NotificationFrequencyType.All:
        return (
          <p>
            Emails will be sent for all notification, including assignment
            changes and replies.
          </p>
        );
      case NotificationFrequencyType.Daily:
        return (
          <p>
            Email notifications are sent at 9AM in the time zone of your Spoke
            workspace.
          </p>
        );
      case NotificationFrequencyType.Periodic:
        return (
          <p>
            Email notifications are sent at 9AM, 1PM, 4PM, and 8PM in the time
            zone of your Spoke workspace.
          </p>
        );
      case NotificationFrequencyType.None:
        return (
          <p>
            You will not receive notifications about changes to your assignment,
            or replies.
          </p>
        );
      default:
        return <p />;
    }
  };

  handleCloseSnackbar = () => {
    this.setState({ snackbarOpen: false });
  };

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

      case UserEditMode.RequestReset:
        {
          const res = await fetch(`/auth/request-reset`, {
            method: "POST",
            body: JSON.stringify(formData),
            headers: { "Content-Type": "application/json" }
          });

          if (res.status !== 200) {
            throw new Error(await res.text());
          }

          this.setState({
            successDialog: true,
            successMessage: "Check your email for a password reset link"
          });
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

          if (res.status !== 200) {
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
    this.setState({ snackbarOpen: true });
  };

  handleClick = () => this.setState({ changePasswordDialog: true });

  handleClose = () => {
    if (this.props.authType === UserEditMode.EmailReset) {
      window.location.href = "/login";
    }
    this.setState({ changePasswordDialog: false, successDialog: false });
  };

  handleNotificationFrequencyChange = (event) => {
    const newFrequency = event.target.value;
    const { user } = this.state;
    user.notificationFrequency = newFrequency;
    this.setState({ user });
  };

  openSuccessDialog = () => this.setState({ successDialog: true });

  buildFormSchema = (authType) => {
    const email = yup.string().email().required();
    const userFields = {
      firstName: yup.string().required(),
      lastName: yup.string().required(),
      cell: yup.string().required(),
      notificationFrequency: yup.string().required()
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
      case UserEditMode.RequestReset:
        // Handled by custom handler at /auth/request-reset
        return yup.object({
          email
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
            authType === UserEditMode.RequestReset ||
            authType === UserEditMode.Edit) && (
            <SpokeFormField
              label="Email"
              name="email"
              disabled={!isLocalAuth}
              {...dataTest("email")}
            />
          )}
          {(authType === UserEditMode.SignUp ||
            authType === UserEditMode.Edit) && (
            <span>
              <SpokeFormField
                label="First name"
                name="firstName"
                {...dataTest("firstName")}
              />
              <SpokeFormField
                label="Last name"
                name="lastName"
                {...dataTest("lastName")}
              />
              <SpokeFormField
                label="Cell Number"
                name="cell"
                {...dataTest("cell")}
              />
              <div style={{ marginTop: 20 }}>
                <InputLabel
                  style={{ marginBottom: 15 }}
                  id="notification-frequency-label"
                >
                  Notification Frequency
                </InputLabel>
                <Select
                  id="notification-frequency"
                  labelId="notification-frequency-label"
                  name="notificationFrequency"
                  value={user.notificationFrequency}
                  onChange={this.handleNotificationFrequencyChange}
                >
                  {Object.values(NotificationFrequencyType).map((option) => (
                    <MenuItem key={option} value={option}>
                      {titleCase(option)}
                    </MenuItem>
                  ))}
                </Select>
              </div>
            </span>
          )}
          {(authType === UserEditMode.Login ||
            authType === UserEditMode.SignUp ||
            authType === UserEditMode.Reset ||
            authType === UserEditMode.EmailReset ||
            authType === UserEditMode.Change) && (
            <SpokeFormField label="Password" name="password" type="password" />
          )}
          {authType === UserEditMode.Change && (
            <SpokeFormField
              label="New Password"
              name="newPassword"
              type="password"
            />
          )}
          {(authType === UserEditMode.SignUp ||
            authType === UserEditMode.Reset ||
            authType === UserEditMode.EmailReset ||
            authType === UserEditMode.Change) && (
            <SpokeFormField
              label="Confirm Password"
              name="passwordConfirm"
              type="password"
            />
          )}
          <div className={css(styles.buttons)}>
            {canChangePassword && (
              <div className={css(styles.container)}>
                <RaisedButton
                  onClick={this.handleClick}
                  label="Change password"
                  variant="outlined"
                />
              </div>
            )}
            <Form.Submit
              type="submit"
              label={saveLabel || "Save"}
              component={GSSubmitButton}
            />
          </div>
        </GSForm>
        <div>
          <Dialog
            {...dataTest("changePasswordDialog")}
            open={this.state.changePasswordDialog}
            onClose={this.handleClose}
          >
            <DialogTitle>Change your password</DialogTitle>
            <DialogContent>
              <UserEdit
                authType={UserEditMode.Change}
                saveLabel="Save new password"
                handleClose={this.handleClose}
                openSuccessDialog={this.openSuccessDialog}
                userId={this.props.userId}
                mutations={this.props.mutations}
              />
            </DialogContent>
          </Dialog>
          <Dialog
            {...dataTest("successPasswordDialog")}
            open={this.state.successDialog}
            onClose={this.handleClose}
          >
            <DialogTitle>
              {this.state.successMessage || "Password changed successfully!"}
            </DialogTitle>
            <DialogActions>
              <RaisedButton onClick={this.handleClose} label="OK" primary />
            </DialogActions>
          </Dialog>
        </div>

        {authType === UserEditMode.Login && (
          <div
            style={{ marginTop: 25, cursor: "pointer" }}
            onClick={this.props.startRequestReset}
          >
            Forgot your password?
          </div>
        )}

        <Snackbar
          anchorOrigin={{
            vertical: "top",
            horizontal: "right"
          }}
          open={this.state.snackbarOpen}
          autoHideDuration={6000}
          onClose={this.handleCloseSnackbar}
          action={
            <IconButton
              size="small"
              aria-label="close"
              color="inherit"
              onClick={this.handleCloseSnackbar}
            >
              <CloseIcon fontSize="small" />
            </IconButton>
          }
        >
          <MuiAlert variant="filled" elevation={6} severity="success">
            Changes Saved!
            <h3>{titleCase(this.state.user.notificationFrequency)}</h3>
            {this.getSnackbarText()}
          </MuiAlert>
        </Snackbar>
      </div>
    );
  }
}

UserEdit.defaultProps = {
  authType: UserEditMode.Edit
};

UserEdit.propTypes = {
  organizationId: PropTypes.string,
  userId: PropTypes.string,
  saveLabel: PropTypes.string,
  nextUrl: PropTypes.string,
  authType: PropTypes.string,
  style: PropTypes.string,
  onRequestClose: PropTypes.func,
  startRequestReset: PropTypes.func,

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
        $userId: String!
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
          notificationFrequency
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
        $userId: String!
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
