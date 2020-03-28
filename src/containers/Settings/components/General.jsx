import React from "react";
import PropTypes from "prop-types";
import moment from "moment";
import gql from "graphql-tag";
import * as yup from "yup";

import Form from "react-formal";
import { Card, CardText, CardActions, CardHeader } from "material-ui/Card";
import Dialog from "material-ui/Dialog";
import FlatButton from "material-ui/FlatButton";
import RaisedButton from "material-ui/RaisedButton";
import Toggle from "material-ui/Toggle";
import DropDownMenu from "material-ui/DropDownMenu";
import MenuItem from "material-ui/MenuItem";
import { StyleSheet, css } from "aphrodite";

import { loadData } from "../../hoc/with-operations";
import { snakeToTitleCase } from "../../../lib/attributes";
import { RequestAutoApproveType } from "../../../api/organization-membership";
import GSForm from "../../../components/forms/GSForm";
import GSSubmitButton from "../../../components/forms/GSSubmitButton";

const styles = StyleSheet.create({
  sectionCard: {
    marginBottom: "20px"
  },
  sectionLabel: {
    opacity: 0.8,
    marginRight: 5
  },
  textingHoursSpan: {
    fontWeight: "bold"
  },
  dialogActions: {
    marginTop: 20,
    display: "flex",
    flexDirection: "row",
    justifyContent: "flex-end"
  }
});

const inlineStyles = {
  dialogButton: {
    display: "inline-block"
  },
  row: {
    display: "flex",
    flexFlow: "row wrap",
    marginLeft: "-15px",
    marginRight: "-15px"
  },
  column: {
    paddingLeft: "15px",
    paddingRight: "15px"
  }
};

const formatTextingHours = hour => moment(hour, "H").format("h a");

class Settings extends React.Component {
  state = {
    textingHoursDialogOpen: false,
    hasNumbersApiKeyChanged: false,
    numbersApiKey: undefined,
    approvalLevel: undefined,
    isWorking: false,
    error: undefined
  };

  editSettings = async (name, input) => {
    this.setState({ isWorking: true, error: undefined });
    let success = false;
    try {
      const response = await this.props.mutations.editSettings(input);
      if (response.errors) throw response.errors;
      success = true;
    } catch (err) {
      const message = `Error saving ${name}: ${err.message}`;
      this.setState({ error: message });
    } finally {
      this.setState({ isWorking: false });
    }
    return success;
  };

  handleSubmitTextingHoursForm = async ({
    textingHoursStart,
    textingHoursEnd
  }) => {
    await this.props.mutations.updateTextingHours(
      textingHoursStart,
      textingHoursEnd
    );
    this.handleCloseTextingHoursDialog();
  };

  handleOpenTextingHoursDialog = () =>
    this.setState({ textingHoursDialogOpen: true });

  handleCloseTextingHoursDialog = () =>
    this.setState({ textingHoursDialogOpen: false });

  handleChangeApprovalLevel = (_event, _index, approvalLevel) =>
    this.setState({ approvalLevel });

  handleSaveApprovalLevel = async () => {
    const { approvalLevel } = this.state;
    const payload = { defaulTexterApprovalStatus: approvalLevel };
    const success = await this.editSettings("Numbers API Key", payload);
    if (!success) {
      this.setState({ approvalLevel: undefined });
    }
  };

  handleEditNumbersApiKey = async payload => {
    let { numbersApiKey } = this.state;
    numbersApiKey = numbersApiKey !== "" ? numbersApiKey : null;
    const input = { numbersApiKey };
    const success = await this.editSettings("Numbers API Key", input);
    if (!success) {
      numbersApiKey = this.props.data.organization.settings.numbersApiKey;
      this.setState({
        hasNumbersApiKeyChanged: false,
        numbersApiKey: undefined
      });
    }
  };

  handleEditOptOutMessage = ({ optOutMessage }) =>
    this.editSettings("Opt Out Messasge", { optOutMessage });

  handleDismissError = () => this.setState({ error: undefined });

  renderTextingHoursForm() {
    const { organization } = this.props.data;
    const { textingHoursStart, textingHoursEnd } = organization;
    const formSchema = yup.object({
      textingHoursStart: yup.number().required(),
      textingHoursEnd: yup.number().required()
    });

    const hourChoices = [...Array(25).keys()].map(hour => ({
      value: hour,
      label: formatTextingHours(hour)
    }));

    return (
      <Dialog
        open={this.state.textingHoursDialogOpen}
        onRequestClose={this.handleCloseTextingHoursDialog}
      >
        <GSForm
          schema={formSchema}
          onSubmit={this.handleSubmitTextingHoursForm}
          defaultValue={{ textingHoursStart, textingHoursEnd }}
        >
          <Form.Field
            label="Start time"
            name="textingHoursStart"
            type="select"
            fullWidth
            choices={hourChoices}
          />
          <Form.Field
            label="End time"
            name="textingHoursEnd"
            type="select"
            fullWidth
            choices={hourChoices}
          />
          <div className={css(styles.dialogActions)}>
            <FlatButton
              label="Cancel"
              style={inlineStyles.dialogButton}
              onTouchTap={this.handleCloseTextingHoursDialog}
            />
            <Form.Button
              type="submit"
              style={inlineStyles.dialogButton}
              component={GSSubmitButton}
              label="Save"
            />
          </div>
        </GSForm>
      </Dialog>
    );
  }

  render() {
    const { hasNumbersApiKeyChanged, isWorking, error } = this.state;
    const { organization } = this.props.data;
    const {
      optOutMessage,
      numbersApiKey,
      defaulTexterApprovalStatus
    } = organization.settings;

    const formSchema = yup.object({
      optOutMessage: yup.string().required()
    });

    const numbersApiKeySchema = yup.object({
      numbersApiKey: yup.string().nullable()
    });

    const approvalLevel =
      this.state.approvalLevel || defaulTexterApprovalStatus;
    const noApprovalChange = approvalLevel === defaulTexterApprovalStatus;

    const errorActions = [
      <FlatButton label="OK" primary={true} onClick={this.handleDismissError} />
    ];

    return (
      <div>
        <Card className={css(styles.sectionCard)}>
          <CardHeader title="Default Text Request Auto-Approval Level" />
          <CardText>
            <p>
              When a new texter joins your organization they will be given this
              auto-approval level for requesting text assignments.
            </p>
            <DropDownMenu
              value={approvalLevel}
              onChange={this.handleChangeApprovalLevel}
            >
              {Object.keys(RequestAutoApproveType).map(level => (
                <MenuItem
                  key={level}
                  value={level}
                  primaryText={snakeToTitleCase(level)}
                />
              ))}
            </DropDownMenu>
          </CardText>
          <CardActions>
            <RaisedButton
              label="Save Default Level"
              primary={true}
              disabled={isWorking || noApprovalChange}
              onClick={this.handleSaveApprovalLevel}
            />
          </CardActions>
        </Card>
        <Card className={css(styles.sectionCard)}>
          <GSForm
            schema={formSchema}
            onSubmit={this.handleEditOptOutMessage}
            defaultValue={{ optOutMessage }}
          >
            <CardHeader title="Opt Out Message" />
            <CardText>
              <Form.Field
                label="Default Opt-Out Message"
                name="optOutMessage"
                fullWidth
              />
            </CardText>
            <CardActions>
              <Form.Button
                label={this.props.saveLabel || "Save Opt-Out Message"}
                type="submit"
                component={RaisedButton}
                disabled={isWorking}
              />
            </CardActions>
          </GSForm>
        </Card>

        <Card className={css(styles.sectionCard)}>
          <CardHeader title="Texting Hours" />
          <CardText>
            <Toggle
              toggled={organization.textingHoursEnforced}
              label="Enforce texting hours?"
              onToggle={async (event, isToggled) =>
                await this.props.mutations.updateTextingHoursEnforcement(
                  isToggled
                )
              }
            />

            {organization.textingHoursEnforced && (
              <div>
                <span className={css(styles.sectionLabel)}>Texting hours:</span>
                <span className={css(styles.textingHoursSpan)}>
                  {formatTextingHours(organization.textingHoursStart)} to{" "}
                  {formatTextingHours(organization.textingHoursEnd)}
                </span>
                {window.TZ
                  ? ` in your organisations local time. Timezone ${window.TZ}`
                  : " in contacts local time (or 12pm-6pm EST if timezone is unknown)"}
              </div>
            )}
          </CardText>
          <CardActions>
            {organization.textingHoursEnforced && (
              <RaisedButton
                label="Change texting hours"
                primary
                onTouchTap={this.handleOpenTextingHoursDialog}
              />
            )}
          </CardActions>
          {this.renderTextingHoursForm()}
        </Card>

        <Card className={css(styles.sectionCard)}>
          <GSForm
            schema={numbersApiKeySchema}
            onChange={({ numbersApiKey: newValue }) =>
              this.setState({
                hasNumbersApiKeyChanged: newValue !== numbersApiKey,
                numbersApiKey: newValue
              })
            }
            onSubmit={this.handleEditNumbersApiKey}
            defaultValue={{
              numbersApiKey:
                this.state.numbersApiKey === undefined
                  ? numbersApiKey
                  : this.state.numbersApiKey
            }}
          >
            <CardHeader title="Assemble Numbers API Key" />
            <CardText>
              To enable automatic filtering of landline phone numbers, you will
              need to put in your Assemble Numbers API Key here.
              <Form.Field
                label="Assemble Numbers API Key"
                name="numbersApiKey"
                fullWidth
              />
            </CardText>
            <CardActions>
              <Form.Button
                label={"Save"}
                type="submit"
                component={RaisedButton}
                disabled={isWorking || !hasNumbersApiKeyChanged}
              />
            </CardActions>
          </GSForm>
        </Card>
        <Dialog
          title="Error Saving Settings"
          open={error !== undefined}
          actions={errorActions}
          onRequestClose={this.handleDismissError}
        >
          {error || ""}
        </Dialog>
      </div>
    );
  }
}

Settings.propTypes = {
  data: PropTypes.object.isRequired,
  match: PropTypes.object.isRequired,
  mutations: PropTypes.object.isRequired
};

const mutations = {
  updateTextingHours: ownProps => (textingHoursStart, textingHoursEnd) => ({
    mutation: gql`
      mutation updateTextingHours(
        $textingHoursStart: Int!
        $textingHoursEnd: Int!
        $organizationId: String!
      ) {
        updateTextingHours(
          textingHoursStart: $textingHoursStart
          textingHoursEnd: $textingHoursEnd
          organizationId: $organizationId
        ) {
          id
          textingHoursEnforced
          textingHoursStart
          textingHoursEnd
        }
      }
    `,
    variables: {
      organizationId: ownProps.match.params.organizationId,
      textingHoursStart,
      textingHoursEnd
    }
  }),
  updateTextingHoursEnforcement: ownProps => textingHoursEnforced => ({
    mutation: gql`
      mutation updateTextingHoursEnforcement(
        $textingHoursEnforced: Boolean!
        $organizationId: String!
      ) {
        updateTextingHoursEnforcement(
          textingHoursEnforced: $textingHoursEnforced
          organizationId: $organizationId
        ) {
          id
          textingHoursEnforced
          textingHoursStart
          textingHoursEnd
        }
      }
    `,
    variables: {
      organizationId: ownProps.match.params.organizationId,
      textingHoursEnforced
    }
  }),
  editSettings: ownProps => input => ({
    mutation: gql`
      mutation editOrganizationSettings(
        $id: String!
        $input: OrganizationSettingsInput!
      ) {
        editOrganizationSettings(id: $id, input: $input) {
          id
          optOutMessage
          numbersApiKey
          defaulTexterApprovalStatus
        }
      }
    `,
    variables: {
      id: ownProps.match.params.organizationId,
      input
    }
  })
};

const queries = {
  data: {
    query: gql`
      query adminGetCampaigns($organizationId: String!) {
        organization(id: $organizationId) {
          id
          name
          textingHoursEnforced
          textingHoursStart
          textingHoursEnd
          settings {
            id
            optOutMessage
            numbersApiKey
            defaulTexterApprovalStatus
          }
        }
      }
    `,
    options: ownProps => ({
      variables: {
        organizationId: ownProps.match.params.organizationId
      },
      fetchPolicy: "cache-and-network"
    })
  }
};

export default loadData({
  queries,
  mutations
})(Settings);
