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
import { StyleSheet, css } from "aphrodite";

import loadData from "./hoc/load-data";
import wrapMutations from "./hoc/wrap-mutations";
import GSForm from "../components/forms/GSForm";
import GSSubmitButton from "../components/forms/GSSubmitButton";

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
    formIsSubmitting: false,
    numbersApiKey: undefined
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

  doSetNumbersApiKey = payload => {
    return this.props.mutations.setNumbersApiKey({
      numbersApiKey:
        this.state.numbersApiKey === "" ? null : this.state.numbersApiKey
    });
  };

  renderTextingHoursForm() {
    const { organization } = this.props.data;
    const { textingHoursStart, textingHoursEnd } = organization;
    const formSchema = yup.object({
      textingHoursStart: yup.number().required(),
      textingHoursEnd: yup.number().required()
    });

    const hours = [
      0,
      1,
      2,
      3,
      4,
      5,
      6,
      7,
      8,
      9,
      10,
      11,
      12,
      13,
      14,
      15,
      16,
      17,
      18,
      19,
      20,
      21,
      22,
      23,
      24
    ];
    const hourChoices = hours.map(hour => ({
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
    const { organization } = this.props.data;
    const { optOutMessage, numbersApiKey } = organization;

    const formSchema = yup.object({
      optOutMessage: yup.string().required()
    });

    const numbersApiKeySchema = yup.object({
      numbersApiKey: yup.string().nullable()
    });

    return (
      <div>
        <Card className={css(styles.sectionCard)}>
          <GSForm
            schema={formSchema}
            onSubmit={this.props.mutations.updateOptOutMessage}
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
                type="submit"
                label={this.props.saveLabel || "Save Opt-Out Message"}
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
            onSubmit={this.doSetNumbersApiKey}
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
                type="submit"
                label={"Save"}
                disabled={!this.state.hasNumbersApiKeyChanged}
              />
            </CardActions>
          </GSForm>
        </Card>
      </div>
    );
  }
}

Settings.propTypes = {
  data: PropTypes.object,
  params: PropTypes.object,
  mutations: PropTypes.object
};

const mapMutationsToProps = ({ ownProps }) => ({
  updateTextingHours: (textingHoursStart, textingHoursEnd) => ({
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
      organizationId: ownProps.params.organizationId,
      textingHoursStart,
      textingHoursEnd
    }
  }),
  updateTextingHoursEnforcement: textingHoursEnforced => ({
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
      organizationId: ownProps.params.organizationId,
      textingHoursEnforced
    }
  }),
  updateOptOutMessage: ({ optOutMessage }) => ({
    mutation: gql`
      mutation updateOptOutMessage(
        $optOutMessage: String!
        $organizationId: String!
      ) {
        updateOptOutMessage(
          optOutMessage: $optOutMessage
          organizationId: $organizationId
        ) {
          id
          optOutMessage
        }
      }
    `,
    variables: {
      organizationId: ownProps.params.organizationId,
      optOutMessage
    }
  }),
  setNumbersApiKey: ({ numbersApiKey }) => ({
    mutation: gql`
      mutation setNumbersApiKey(
        $numbersApiKey: String
        $organizationId: String!
      ) {
        setNumbersApiKey(
          organizationId: $organizationId
          numbersApiKey: $numbersApiKey
        ) {
          id
          numbersApiKey
        }
      }
    `,
    variables: {
      organizationId: ownProps.params.organizationId,
      numbersApiKey
    }
  })
});

const mapQueriesToProps = ({ ownProps }) => ({
  data: {
    query: gql`
      query adminGetCampaigns($organizationId: String!) {
        organization(id: $organizationId) {
          id
          name
          textingHoursEnforced
          textingHoursStart
          textingHoursEnd
          optOutMessage
          numbersApiKey
        }
      }
    `,
    variables: {
      organizationId: ownProps.params.organizationId
    },
    forceFetch: true
  }
});

export default loadData(wrapMutations(Settings), {
  mapQueriesToProps,
  mapMutationsToProps
});
