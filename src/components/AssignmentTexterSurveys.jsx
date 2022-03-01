import Card from "@material-ui/core/Card";
import CardContent from "@material-ui/core/CardContent";
import CardHeader from "@material-ui/core/CardHeader";
import Collapse from "@material-ui/core/Collapse";
import Divider from "@material-ui/core/Divider";
import FormControl from "@material-ui/core/FormControl";
import IconButton from "@material-ui/core/IconButton";
import InputLabel from "@material-ui/core/InputLabel";
import MenuItem from "@material-ui/core/MenuItem";
import Select from "@material-ui/core/Select";
import Typography from "@material-ui/core/Typography";
import ArrowDropDownIcon from "@material-ui/icons/ArrowDropDown";
import ExpandLessIcon from "@material-ui/icons/ExpandLess";
import ExpandMoreIcon from "@material-ui/icons/ExpandMore";
import sample from "lodash/sample";
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
    padding: 5
  },
  cardContent: {
    padding: 5
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

  handleExpandChange = () => {
    this.setState({ showAllQuestions: !this.state.showAllQuestions });
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

  handleSelectChange = (interactionStep, value) => {
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
            value={responseValue ?? ""}
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
    const questions = interactionSteps.filter(
      ({ question }) => (question.text || "") !== ""
    );

    const { showAllQuestions } = this.state;
    return questions.length === 0 ? null : (
      <Card style={styles.card}>
        <CardHeader
          title={
            <Typography variant="body1" component="span">
              {showAllQuestions ? "All questions" : "Current question"}
            </Typography>
          }
          style={styles.cardHeader}
          action={
            questions.length > 1 && (
              <IconButton onClick={this.handleExpandChange}>
                {showAllQuestions ? <ExpandLessIcon /> : <ExpandMoreIcon />}
              </IconButton>
            )
          }
        />
        <CardContent style={styles.cardContent}>
          {currentInteractionStep && this.renderStep(currentInteractionStep)}
        </CardContent>
        <Collapse in={showAllQuestions}>
          <CardContent style={styles.cardContent}>
            {questions
              .filter((step) => step.id !== currentInteractionStep.id)
              .map((step) => this.renderStep(step))}
          </CardContent>
        </Collapse>
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
