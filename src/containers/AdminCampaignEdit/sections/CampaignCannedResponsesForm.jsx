import PropTypes from "prop-types";
import React from "react";
import * as yup from "yup";
import Form from "react-formal";
import { StyleSheet, css } from "aphrodite";

import { List, ListItem } from "material-ui/List";
import FlatButton from "material-ui/FlatButton";
import Divider from "material-ui/Divider";
import IconButton from "material-ui/IconButton";
import CreateIcon from "material-ui/svg-icons/content/create";
import DeleteIcon from "material-ui/svg-icons/action/delete";

import { dataTest } from "../../../lib/attributes";
import theme from "../../../styles/theme";
import GSForm from "../../../components/forms/GSForm";
import CampaignCannedResponseForm from "./CampaignCannedResponseForm";
import CampaignFormSectionHeading from "../components/CampaignFormSectionHeading";

const styles = StyleSheet.create({
  formContainer: {
    ...theme.layouts.greenBox,
    maxWidth: "100%",
    paddingTop: 10,
    paddingBottom: 10,
    paddingRight: 10,
    paddingLeft: 10,
    marginTop: 15,
    textAlign: "left"
  },
  form: {
    backgroundColor: theme.colors.white,
    padding: 10
  }
});

export default class CampaignCannedResponsesForm extends React.Component {
  state = {
    showForm: false
  };

  formSchema = yup.object({
    cannedResponses: yup.array().of(
      yup.object({
        title: yup.string(),
        text: yup.string()
      })
    )
  });

  showAddForm() {
    if (this.state.showForm) {
      return (
        <div className={css(styles.formContainer)}>
          <div className={css(styles.form)}>
            <CampaignCannedResponseForm
              onSaveCannedResponse={ele => {
                const newVals = this.props.formValues.cannedResponses.slice(0);
                const newEle = {
                  ...ele
                };
                newEle.id = Math.random()
                  .toString(36)
                  .replace(/[^a-zA-Z1-9]+/g, "");
                newVals.push(newEle);
                this.props.onChange({
                  cannedResponses: newVals
                });
                this.setState({ showForm: false });
              }}
              customFields={this.props.customFields}
            />
          </div>
        </div>
      );
    }
    return (
      <FlatButton
        {...dataTest("newCannedResponse")}
        secondary
        label="Add new canned response"
        icon={<CreateIcon />}
        onTouchTap={() => this.setState({ showForm: true })}
      />
    );
  }

  listItems(cannedResponses) {
    const listItems = cannedResponses.map(response => (
      <ListItem
        {...dataTest("cannedResponse")}
        value={response.text}
        key={response.id}
        primaryText={response.title}
        secondaryText={response.text}
        rightIconButton={
          <IconButton
            onTouchTap={() => {
              const newVals = this.props.formValues.cannedResponses
                .map(responseToDelete => {
                  if (responseToDelete.id === response.id) {
                    return null;
                  }
                  return responseToDelete;
                })
                .filter(ele => ele !== null);

              this.props.onChange({
                cannedResponses: newVals
              });
            }}
          >
            <DeleteIcon />
          </IconButton>
        }
        secondaryTextLines={2}
      />
    ));
    return listItems;
  }

  render() {
    const { formValues } = this.props;
    const cannedResponses = formValues.cannedResponses;
    const list =
      cannedResponses.length === 0 ? null : (
        <List>
          {this.listItems(cannedResponses)}
          <Divider />
        </List>
      );

    return (
      <GSForm
        schema={this.formSchema}
        value={formValues}
        onChange={this.props.onChange}
        onSubmit={this.props.onSubmit}
      >
        <CampaignFormSectionHeading
          title="Canned responses for texters"
          subtitle="Save some scripts for your texters to use to answer additional FAQs that may come up outside of the survey questions and scripts you already set up."
        />
        {list}
        {this.showAddForm()}
        <Form.Button
          type="submit"
          disabled={this.props.saveDisabled}
          label={this.props.saveLabel}
        />
      </GSForm>
    );
  }
}

CampaignCannedResponsesForm.propTypes = {
  saveLabel: PropTypes.string,
  saveDisabled: PropTypes.bool,
  onSubmit: PropTypes.func,
  onChange: PropTypes.func,
  formValues: PropTypes.object,
  customFields: PropTypes.array
};
