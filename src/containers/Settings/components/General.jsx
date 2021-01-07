import { css, StyleSheet } from "aphrodite";
import gql from "graphql-tag";
import { DateTime } from "luxon";
import { Card, CardActions, CardHeader, CardText } from "material-ui/Card";
import Dialog from "material-ui/Dialog";
import DropDownMenu from "material-ui/DropDownMenu";
import FlatButton from "material-ui/FlatButton";
import MenuItem from "material-ui/MenuItem";
import RaisedButton from "material-ui/RaisedButton";
import Toggle from "material-ui/Toggle";
import PropTypes from "prop-types";
import React from "react";
import Form from "react-formal";
import * as yup from "yup";

import { RequestAutoApproveType } from "../../../api/organization-membership";
import GSForm from "../../../components/forms/GSForm";
import GSSubmitButton from "../../../components/forms/GSSubmitButton";
import { snakeToTitleCase } from "../../../lib/attributes";
import { loadData } from "../../hoc/with-operations";

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

const formatTextingHours = (hour) =>
  DateTime.local().set({ hour }).toFormat("h a");

class Settings extends React.Component {
  state = {
    textingHoursDialogOpen: false,
    optOutMessage: undefined,
    numbersApiKey: undefined,
    approvalLevel: undefined,
    trollbotWebhookUrl: undefined,
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
    const success = await this.editSettings("Approval Level", payload);
    if (!success) {
      this.setState({ approvalLevel: undefined });
    }
  };

  handleSaveNumbersApiKey = () => {
    const { numbersApiKey } = this.state;
    this.editSettings("Numbers API Key", { numbersApiKey });
  };

  handleSaveOptOutMessage = () => {
    const { optOutMessage } = this.state;
    this.editSettings("Opt Out Message", { optOutMessage });
  };

  handleSaveTrollbotUrl = () => {
    const { trollbotWebhookUrl } = this.state;
    this.editSettings("TrollBot Webhook URL", { trollbotWebhookUrl });
  };

  handleEditShowContactLastName = async (event, isToggled) =>
    this.editSettings("Show Contact Last Name", {
      showContactLastName: isToggled
    });

  handleEditShowContactCell = async (event, isToggled) =>
    this.editSettings("Show Contact Cell Phone", {
      showContactCell: isToggled
    });

  handleDismissError = () => this.setState({ error: undefined });

  renderTextingHoursForm() {
    const { organization } = this.props.data;
    const { textingHoursStart, textingHoursEnd } = organization;
    const formSchema = yup.object({
      textingHoursStart: yup.number().required(),
      textingHoursEnd: yup.number().required()
    });

    const hourChoices = [...Array(25).keys()].map((hour) => ({
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
              onClick={this.handleCloseTextingHoursDialog}
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
    const { isWorking, error } = this.state;
    const { organization } = this.props.data;
    const {
      defaulTexterApprovalStatus,
      showContactLastName,
      showContactCell
    } = organization.settings;

    const formSchema = yup.object({
      optOutMessage: yup.string().required()
    });

    const numbersApiKeySchema = yup.object({
      numbersApiKey: yup.string().nullable()
    });

    const trollbotSettingsSchema = yup.object({
      trollbotWebhookUrl: yup.string()
    });

    const approvalLevel =
      this.state.approvalLevel || defaulTexterApprovalStatus;
    const noApprovalChange = approvalLevel === defaulTexterApprovalStatus;

    const optOutMessage =
      this.state.optOutMessage || organization.settings.optOutMessage;
    const noMessageChange =
      optOutMessage === organization.settings.optOutMessage;
    const isOptOutSaveDisabled = isWorking || noMessageChange;

    const numbersApiKey =
      this.state.numbersApiKey || organization.settings.numbersApiKey;
    const noApiKeyChange =
      numbersApiKey === organization.settings.numbersApiKey;
    const isApiKeySaveDisabled = isWorking || noApiKeyChange;

    const trollbotWebhookUrl =
      this.state.trollbotWebhookUrl || organization.settings.trollbotWebhookUrl;
    const noWebhookChange =
      trollbotWebhookUrl === organization.settings.trollbotWebhookUrl;
    const isTrollbotSaveDisabled = isWorking || noWebhookChange;

    const errorActions = [
      <FlatButton
        key="ok"
        label="OK"
        primary
        onClick={this.handleDismissError}
      />
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
              {Object.keys(RequestAutoApproveType).map((level) => (
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
              primary
              disabled={isWorking || noApprovalChange}
              onClick={this.handleSaveApprovalLevel}
            />
          </CardActions>
        </Card>
        <Card className={css(styles.sectionCard)}>
          <GSForm
            schema={formSchema}
            value={{
              optOutMessage
            }}
            onChange={({ optOutMessage: newValue }) =>
              this.setState({
                optOutMessage: newValue
              })
            }
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
              <RaisedButton
                label="Save Opt-Out Message"
                primary
                disabled={isOptOutSaveDisabled}
                onClick={this.handleSaveOptOutMessage}
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
              onToggle={(event, isToggled) =>
                this.props.mutations.updateTextingHoursEnforcement(isToggled)
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
                onClick={this.handleOpenTextingHoursDialog}
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
                numbersApiKey: newValue
              })
            }
            value={{
              numbersApiKey
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
              <RaisedButton
                label="Save Api Key"
                primary
                disabled={isApiKeySaveDisabled}
                onClick={this.handleSaveNumbersApiKey}
              />
            </CardActions>
          </GSForm>
        </Card>

        <Card className={css(styles.sectionCard)}>
          <CardHeader title="Contact Information Display" />
          <CardText>
            <p>
              Choose how much information about a contact is displayed to the
              texter.
            </p>
            <Toggle
              toggled={showContactLastName}
              label="Show contact's last name?"
              onToggle={this.handleEditShowContactLastName}
            />
            <Toggle
              toggled={showContactCell}
              label="Show contact's cell phone number?"
              onToggle={this.handleEditShowContactCell}
            />
          </CardText>
        </Card>

        {window.ENABLE_TROLLBOT && (
          <Card className={css(styles.sectionCard)}>
            <GSForm
              schema={trollbotSettingsSchema}
              value={{ trollbotWebhookUrl }}
              onChange={({ trollbotWebhookUrl: newValue }) =>
                this.setState({
                  trollbotWebhookUrl: newValue
                })
              }
            >
              <CardHeader title="TrollBot" />
              <CardText>
                If set, a payload will be sent to this URL for every TrollBot
                alarm.
                <Form.Field
                  label="Webhook URL"
                  name="trollbotWebhookUrl"
                  fullWidth
                />
              </CardText>
              <CardActions>
                <RaisedButton
                  label="Save Trollbot Url"
                  primary
                  disabled={isTrollbotSaveDisabled}
                  onClick={this.handleSaveTrollbotUrl}
                />
              </CardActions>
            </GSForm>
          </Card>
        )}

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
  mutations: PropTypes.object.isRequired
};

const mutations = {
  updateTextingHours: (ownProps) => (textingHoursStart, textingHoursEnd) => ({
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
  updateTextingHoursEnforcement: (ownProps) => (textingHoursEnforced) => ({
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
  editSettings: (ownProps) => (input) => ({
    mutation: gql`
      mutation editOrganizationSettings(
        $id: String!
        $input: OrganizationSettingsInput!
      ) {
        editOrganizationSettings(id: $id, input: $input) {
          id
          optOutMessage
          numbersApiKey
          trollbotWebhookUrl
          defaulTexterApprovalStatus
          showContactLastName
          showContactCell
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
            trollbotWebhookUrl
            defaulTexterApprovalStatus
            showContactLastName
            showContactCell
          }
        }
      }
    `,
    options: (ownProps) => ({
      variables: {
        organizationId: ownProps.match.params.organizationId
      }
    })
  }
};

export default loadData({
  queries,
  mutations
})(Settings);
