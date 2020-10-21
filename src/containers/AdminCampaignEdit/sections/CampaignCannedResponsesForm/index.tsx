import React from "react";
import * as yup from "yup";
import Form from "react-formal";
import { StyleSheet, css } from "aphrodite";

import FlatButton from "material-ui/FlatButton";
import CreateIcon from "material-ui/svg-icons/content/create";

import { CannedResponse } from "../../../../api/canned-response";
import { dataTest } from "../../../../lib/attributes";
import theme from "../../../../styles/theme";
import GSForm from "../../../../components/forms/GSForm";
import { LargeList } from "../../../../components/LargeList";
import CreateCannedResponseForm from "./components/CreateCannedResponseForm";
import CannedResponseRow from "./components/CannedResponseRow";
import CampaignFormSectionHeading from "../../components/CampaignFormSectionHeading";

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

const formSchema = yup.object({
  cannedResponses: yup.array().of(
    yup.object({
      title: yup.string(),
      text: yup.string()
    })
  )
});

interface Props {
  saveLabel: string;
  saveDisabled: boolean;
  onSubmit(...args: any[]): void;
  onChange(payload: { cannedResponses: CannedResponse[] }): void;
  formValues: { cannedResponses: CannedResponse[] };
  customFields: string[];
}

interface State {
  showForm: boolean;
}

export default class CampaignCannedResponsesForm extends React.Component<
  Props,
  State
> {
  state: State = {
    showForm: false
  };

  handleOnCancelCreateForm = () => this.setState({ showForm: false });

  handleOnSaveResponse = (response: CannedResponse) => {
    const newVals = this.props.formValues.cannedResponses.slice(0);
    const newEle: CannedResponse = {
      ...response
    };
    newEle.id = Math.random()
      .toString(36)
      .replace(/[^a-zA-Z1-9]+/g, "");
    newVals.push(newEle);
    this.props.onChange({
      cannedResponses: newVals
    });
    this.setState({ showForm: false });
  };

  render() {
    const { showForm } = this.state;
    const { formValues, customFields } = this.props;
    const cannedResponses = formValues.cannedResponses;

    const createHandleOnDelete = (responseId: string) => () => {
      const newVals = this.props.formValues.cannedResponses.filter(
        response => response.id !== responseId
      );

      this.props.onChange({
        cannedResponses: newVals
      });
    };

    return (
      <GSForm
        schema={formSchema}
        value={formValues}
        onChange={this.props.onChange}
        onSubmit={this.props.onSubmit}
      >
        <CampaignFormSectionHeading
          title="Canned responses for texters"
          subtitle="Save some scripts for your texters to use to answer additional FAQs that may come up outside of the survey questions and scripts you already set up."
        />
        {cannedResponses.length > 0 ? (
          <LargeList>
            {cannedResponses.map(cannedResponse => (
              <CannedResponseRow
                cannedResponse={cannedResponse}
                onDelete={createHandleOnDelete(cannedResponse.id)}
              />
            ))}
          </LargeList>
        ) : (
          <p>No canned responses</p>
        )}
        <hr />
        {showForm ? (
          <div className={css(styles.formContainer)}>
            <div className={css(styles.form)}>
              <CreateCannedResponseForm
                customFields={customFields}
                onCancel={this.handleOnCancelCreateForm}
                onSaveCannedResponse={this.handleOnSaveResponse}
              />
            </div>
          </div>
        ) : (
          <FlatButton
            {...dataTest("newCannedResponse")}
            secondary
            label="Add new canned response"
            icon={<CreateIcon />}
            onTouchTap={() => this.setState({ showForm: true })}
          />
        )}
        <Form.Button
          type="submit"
          disabled={this.props.saveDisabled}
          label={this.props.saveLabel}
        />
      </GSForm>
    );
  }
}
