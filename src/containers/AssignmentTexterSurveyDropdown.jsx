import gql from "graphql-tag";
import Divider from "material-ui/Divider";
import MenuItem from "material-ui/MenuItem";
import SelectField from "material-ui/SelectField";
import PropTypes from "prop-types";
import React, { Component } from "react";

import { loadData } from "./hoc/with-operations";

const styles = {
  currentStepSelect: {
    fontSize: 16,
    color: "red"
  },
  previousStepSelect: {
    fontSize: 16,
    opacity: 0.8
    // fontSize: 16
  }
};

class AssignmentTexterSurveyDropdown extends Component {
  handleAnswerChange = async (event, index, value) => {
    const { step, campaignContactId } = this.props;

    if (value !== "clearResponse") {
      const questionResponse = {
        interactionStepId: step.id,
        campaignContactId,
        value
      };
      await this.props.mutations.editQuestionResponse(questionResponse);
    }
  };

  renderAnswers() {
    const { step } = this.props;
    const menuItems = step.question.answerOptions.map((answerOption) => (
      <MenuItem
        key={answerOption.value}
        value={answerOption.value}
        primaryText={answerOption.value}
      />
    ));

    menuItems.push(<Divider />);
    menuItems.push(
      <MenuItem
        key="clear"
        value="clearResponse"
        primaryText="Clear response"
        // onClick={(event) => this.handleAnswerDelete(event, step.id)}
      />
    );

    return menuItems;
  }

  render() {
    const { step, isCurrentStep } = this.props;
    const responseValue = step.questionResponse
      ? step.questionResponse.value
      : null;
    const { question } = step;

    if (!question) {
      return null;
    }

    return (
      <div>
        <SelectField
          style={
            isCurrentStep ? styles.currentStepSelect : styles.previousStepSelect
          }
          onChange={this.handleAnswerChange}
          name={question.id}
          value={responseValue}
          floatingLabelText={question.text}
          hintText="Choose answer"
        >
          {this.renderAnswers()}
        </SelectField>
      </div>
    );
  }
}

AssignmentTexterSurveyDropdown.propTypes = {
  step: PropTypes.object,
  isCurrentStep: PropTypes.bool,
  campaignContactId: PropTypes.number,
  mutations: PropTypes.object
};

const mutations = {
  editQuestionResponse: (_ownProps) => (questionResponse) => ({
    mutation: gql`
      mutation editQuestionResponse($questionResponse: QuestionResponseInput!) {
        editQuestionResponse(questionResponse: $questionResponse) {
          id
          value
        }
      }
    `,
    variables: {
      questionResponse
    }
  })
};

export default loadData({ mutations })(AssignmentTexterSurveyDropdown);
