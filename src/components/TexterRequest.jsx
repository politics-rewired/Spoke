import React from "react";
import { StyleSheet, css } from "aphrodite";
import theme from "../styles/theme";
import loadData from "../containers/hoc/load-data";
import wrapMutations from "../containers/hoc/wrap-mutations";
import GSForm from "./forms/GSForm";
import RaisedButton from "material-ui/RaisedButton";
import TextField from "material-ui/TextField";
import SelectField from "material-ui/SelectField";
import MenuItem from "material-ui/MenuItem";
import Paper from "material-ui/Paper";
import Form from "react-formal";
import * as yup from "yup";
import gql from "graphql-tag";
import LoadingIndicator from "./LoadingIndicator";

class TexterRequest extends React.Component {
  constructor(props) {
    super(props);

    const myCurrentAssignmentTargets = this.props.data.organization
      ? this.props.data.organization.myCurrentAssignmentTargets
      : [];

    const firstAssignmentTarget = myCurrentAssignmentTargets[0];

    const [firstTeamId, maxRequestCount] = firstAssignmentTarget
      ? [firstAssignmentTarget.teamId, firstAssignmentTarget.maxRequestCount]
      : [undefined, undefined];

    this.state = {
      selectedAssignment: firstTeamId,
      count: maxRequestCount,
      maxRequestCount: maxRequestCount,
      email: undefined,
      submitting: false,
      error: undefined,
      finished: false
    };
  }

  componentDidMount() {
    this.props.data.refetch();
  }

  submit = async () => {
    const { count, email, selectedAssignment, submitting } = this.state;
    if (submitting) return;

    this.setState({ submitting: true, error: undefined });
    try {
      const payload = { count, email, preferredTeamId: selectedAssignment };
      const response = await this.props.mutations.requestTexts(payload);
      if (response.errors) throw response.errors;

      const message = response.data.requestTexts;

      if (message.includes("Created")) {
        this.setState({ finished: true });
      } else if (message === "Unrecognized email") {
        this.setState({
          error: `Unrecognized email: please make sure you're logged into Spoke with the same email as Slack.`
        });
      } else if (
        message === "Not created; a shift already requested < 10 mins ago."
      ) {
        this.setState({
          error: "Sorry - you just requested! Please wait 10 minutes."
        });
      } else if (message === "No texts available at the moment") {
        this.setState({ error: message });
      } else {
        this.setState({ finished: true });
      }
    } catch (err) {
      this.setState({ error: err.message });
    } finally {
      this.setState({ submitting: false });
    }
  };

  componentWillMount() {
    this.state.email = this.props.user.email;
  }

  setSelectedAssignment = (_1, _2, teamId) => {
    const myCurrentAssignmentTargets = this.props.data.organization
      ? this.props.data.organization.myCurrentAssignmentTargets
      : [];

    const selection = myCurrentAssignmentTargets.find(
      at => at.teamId === teamId
    );

    this.setState({
      selectedAssignment: teamId,
      count: Math.min(this.state.count, selection.maxRequestCount),
      maxRequestCount: selection.maxRequestCount
    });
  };

  render() {
    if (this.props.data.loading) {
      return <LoadingIndicator />;
    }

    const { myCurrentAssignmentTargets } = this.props.data.organization;

    const textsAvailable = myCurrentAssignmentTargets.length > 0;

    if (this.props.data.currentUser.currentRequest) {
      const { amount } = this.props.data.currentUser.currentRequest;

      return (
        <Paper>
          <div style={{ padding: "20px" }}>
            <h3> You currently have a pending request</h3>
            <p>
              You requested {amount} texts. Hold on, someone will approve them
              soon!
            </p>
          </div>
        </Paper>
      );
    }

    if (!textsAvailable) {
      return (
        <Paper>
          <div style={{ padding: "20px" }}>
            <h3> No texts available right now </h3>
            <p>
              {" "}
              Watch Slack for an announcement on when new texts are available!{" "}
            </p>
          </div>
        </Paper>
      );
    }

    const {
      email,
      count,
      error,
      submitting,
      finished,
      selectedAssignment,
      maxRequestCount
    } = this.state;
    const inputSchema = yup.object({
      count: yup.number().required(),
      email: yup.string().required()
    });

    if (finished) {
      return (
        <div>
          <h3> Submitted Successfully – Thank you! </h3>
          <p>
            {" "}
            Give us a few minutes to assign your texts. You'll receive an email
            notification when we've done so. If you requested your texts after
            hours, you’ll get them when texting opens at 9am ET :).{" "}
          </p>
        </div>
      );
    }

    const makeOptionText = at =>
      `${at.teamTitle}: ${at.maxRequestCount} ${
        at.type === "UNSENT" ? "Initials" : "Replies"
      }`;

    return (
      <div>
        <div>
          Ready for texts? Pick an assignment: <br />
          {this.props.data ? (
            <SelectField
              value={selectedAssignment}
              onChange={this.setSelectedAssignment}
            >
              {this.props.data.organization.myCurrentAssignmentTargets.map(
                at => (
                  <MenuItem
                    key={at.teamId}
                    value={at.teamId}
                    primaryText={makeOptionText(at)}
                  />
                )
              )}
            </SelectField>
          ) : (
            <LoadingIndicator />
          )}
        </div>
        <GSForm
          ref="requestForm"
          schema={inputSchema}
          value={{ email, count }}
          onSubmit={this.submit}
        >
          <label htmlFor="count"> Count: </label>
          <TextField
            name="count"
            label="Count"
            type="number"
            value={count}
            onChange={e => {
              const formVal = parseInt(e.target.value, 10) || 0;
              let count =
                maxRequestCount > 0
                  ? Math.min(maxRequestCount, formVal)
                  : formVal;
              count = Math.max(count, 0);
              this.setState({ count });
            }}
          />
          <br />
          <RaisedButton
            primary={true}
            onClick={this.submit}
            disabled={submitting}
            fullWidth
          >
            {" "}
            Request More Texts{" "}
          </RaisedButton>
        </GSForm>
        {error && (
          <div style={{ color: "red" }}>
            <p> {error} </p>
          </div>
        )}
      </div>
    );
  }
}

const mapQueriesToProps = ({ ownProps }) => ({
  data: {
    query: gql`
      query currentUserFormInfo($organizationId: String!) {
        currentUser {
          id
          currentRequest(organizationId: $organizationId) {
            id
            status
            amount
          }
        }
        organization(id: $organizationId) {
          id
          myCurrentAssignmentTargets {
            type
            maxRequestCount
            teamTitle
            teamId
          }
        }
      }
    `,
    variables: {
      organizationId: ownProps.organizationId
    },
    pollInterval: 10000
  }
});

const mapMutationsToProps = ({ ownProps }) => ({
  requestTexts: ({ count, email, preferredTeamId }) => ({
    mutation: gql`
      mutation requestTexts(
        $count: Int!
        $email: String!
        $organizationId: String!
        $preferredTeamId: Int!
      ) {
        requestTexts(
          count: $count
          email: $email
          organizationId: $organizationId
          preferredTeamId: $preferredTeamId
        )
      }
    `,
    variables: {
      count,
      email,
      preferredTeamId,
      organizationId: ownProps.organizationId
    }
  })
});

export default loadData(wrapMutations(TexterRequest), {
  mapQueriesToProps,
  mapMutationsToProps
});
