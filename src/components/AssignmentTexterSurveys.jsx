import Divider from "@material-ui/core/Divider";
import FormControl from "@material-ui/core/FormControl";
import InputLabel from "@material-ui/core/InputLabel";
import MenuItem from "@material-ui/core/MenuItem";
import Select from "@material-ui/core/Select";
import ArrowDropDownIcon from "@material-ui/icons/ArrowDropDown";
import sample from "lodash/sample";
import { Card, CardHeader, CardText } from "material-ui/Card";
import { grey50 } from "material-ui/styles/colors";
import PropTypes from "prop-types";
import React, { Component } from "react";

const styles = {
  root: {},
  card: {
    marginTop: 10,
    marginBottom: 10,
    backgroundColor: grey50,
    padding: 10
  },
  cardHeader: {
    padding: 0
  },
  cardText: {
    padding: 0
  }
};

const LargeDropDownIcon = (props) => (
  <ArrowDropDownIcon fontSize="large" {...props} />
);

class AssignmentTexterSurveys extends Component {
  constructor(props) {
    super(props);

    this.state = {
      showAllQuestions: false
    };
  }

  getNextScript = ({ interactionStep, answerValue }) => {
    const answerOption = interactionStep.question.answerOptions.find(
      ({ value }) => value === answerValue
    );

    const { nextInteractionStep } = answerOption;
    if (nextInteractionStep) {
      const { scriptOptions } = nextInteractionStep;
      return sample(scriptOptions);
    }
    return null;
  };

  handleExpandChange = (newExpandedState) => {
    this.setState({ showAllQuestions: newExpandedState });
  };

  // eslint-disable-next-line react/no-unused-class-component-methods
  handlePrevious = () => {
    const { stepIndex } = this.state;
    this.setState({
      stepIndex: stepIndex - 1
    });
  };

  // eslint-disable-next-line react/no-unused-class-component-methods
  handleNext = () => {
    const { stepIndex } = this.state;
    this.setState({
      stepIndex: stepIndex + 1
    });
  };

  handleSelectChange = async (interactionStep, value) => {
    const { onQuestionResponseChange } = this.props;
    let questionResponseValue = null;
    let nextScript = "";

    if (value !== "clearResponse") {
      questionResponseValue = value;
      nextScript = this.getNextScript({ interactionStep, answerValue: value });
    }

    onQuestionResponseChange({
      interactionStep,
      questionResponseValue,
      nextScript
    });
  };

  renderAnswers = (step) => {
    const menuItems = step.question.answerOptions.map((answerOption) => (
      <MenuItem key={answerOption.value} value={answerOption.value}>
        {answerOption.value}
      </MenuItem>
    ));

    menuItems.push(<Divider key="divider" />);
    menuItems.push(
      <MenuItem key="clear" value="clearResponse">
        Clear response
      </MenuItem>
    );

    return menuItems;
  };

  renderStep(step) {
    const { questionResponses } = this.props;
    const responseValue = questionResponses[step.id];
    const { question } = step;

    return question.text ? (
      <div key={step.id}>
        <FormControl fullWidth>
          <InputLabel>{question?.text}</InputLabel>
          <Select
            name={step.id}
            value={responseValue}
            IconComponent={LargeDropDownIcon}
            onChange={(e) => this.handleSelectChange(step, e.target.value)}
          >
            {this.renderAnswers(step)}
          </Select>
        </FormControl>
      </div>
    ) : (
      ""
    );
  }

  render() {
    const { interactionSteps, currentInteractionStep } = this.props;

    const { showAllQuestions } = this.state;
    return interactionSteps.length === 0 ? null : (
      <Card style={styles.card} onExpandChange={this.handleExpandChange}>
        <CardHeader
          style={styles.cardHeader}
          title={showAllQuestions ? "All questions" : "Current question"}
          showExpandableButton={interactionSteps.length > 1}
        />
        <CardText style={styles.cardText}>
          {showAllQuestions ? "" : this.renderStep(currentInteractionStep)}
        </CardText>
        <CardText style={styles.cardText} expandable>
          {interactionSteps.map((step) => this.renderStep(step))}
        </CardText>
      </Card>
    );
  }
}

AssignmentTexterSurveys.propTypes = {
  contact: PropTypes.object,
  interactionSteps: PropTypes.array,
  currentInteractionStep: PropTypes.object,
  questionResponses: PropTypes.object,
  onQuestionResponseChange: PropTypes.func
};

export default AssignmentTexterSurveys;
