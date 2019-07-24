import PropTypes from "prop-types";
import React from "react";
import loadData from "./hoc/load-data";
import wrapMutations from "./hoc/wrap-mutations";
import gql from "graphql-tag";

import GSForm from "../components/forms/GSForm";
import Form from "react-formal";
import * as yup from "yup";

import { dataTest } from "../lib/attributes";

class UserEdit extends React.Component {
  constructor(props) {
    super(props);
    this.handleSave = this.handleSave.bind(this);
  }

  state = {
    finished: false,
    stepIndex: 0
  };

  async componentWillMount() {
    await this.props.mutations.editUser(null);
  }

  async handleSave(formData) {
    await this.props.mutations.editUser(formData);
    if (this.props.onRequestClose) {
      this.props.onRequestClose();
    }
  }

  render() {
    const user = (this.props.editUser && this.props.editUser.editUser) || {};
    const formSchema = yup.object({
      firstName: yup.string().required(),
      lastName: yup.string().required(),
      cell: yup.string().required(),
      email: yup.string().email()
    });
    return (
      <GSForm
        schema={formSchema}
        onSubmit={this.handleSave}
        defaultValue={user}
      >
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
        <Form.Field label="Email" name="email" {...dataTest("email")} />
        <Form.Field label="Cell Number" name="cell" {...dataTest("cell")} />
        {this.props.allowSetPassword && (
          <div>
            <Form.Field label="Password" name="password" />
            <Form.Field label="Confirm Password" name="passwordConfirm" />
          </div>
        )}
        <Form.Button type="submit" label={this.props.saveLabel || "Save"} />
      </GSForm>
    );
  }
}

UserEdit.defaultProps = {
  saveLabel: "Save",
  allowSetPassword: false
};

UserEdit.propTypes = {
  mutations: PropTypes.object.isRequired,
  router: PropTypes.object.isRequired,
  userId: PropTypes.string.isRequired,
  organizationId: PropTypes.string.isRequired,
  editUser: PropTypes.object,
  saveLabel: PropTypes.string,
  allowSetPassword: PropTypes.bool,
  onRequestClose: PropTypes.func
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
      })
    };
  }
};

export default loadData(wrapMutations(UserEdit), { mapMutationsToProps });
