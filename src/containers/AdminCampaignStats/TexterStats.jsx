import gql from "graphql-tag";
import LinearProgress from "material-ui/LinearProgress";
import PropTypes from "prop-types";
import React from "react";

import { loadData } from "../hoc/with-operations";

class TexterStats extends React.Component {
  renderAssignment(assignment) {
    const { contactsCount, unmessagedCount, texter, id } = assignment;
    if (contactsCount === 0) {
      return <div key={id} />;
    }

    const percentComplete = Math.round(
      ((contactsCount - unmessagedCount) * 100) / contactsCount
    );

    return (
      <div key={id}>
        {texter.firstName} {texter.lastName}
        <div>{percentComplete}%</div>
        <LinearProgress mode="determinate" value={percentComplete} />
      </div>
    );
  }

  renderAssignmentDynamic(assignment) {
    const { contactsCount, unmessagedCount, texter, id } = assignment;
    if (contactsCount === 0) {
      return <div key={id} />;
    }

    return (
      <div key={id}>
        {texter.firstName}
        <div>{contactsCount - unmessagedCount} initial messages sent</div>
      </div>
    );
  }

  render() {
    const { campaign } = this.props.data;
    const { assignments } = campaign;
    return (
      <div>
        {assignments.map((assignment) =>
          campaign.useDynamicAssignment
            ? this.renderAssignmentDynamic(assignment)
            : this.renderAssignment(assignment)
        )}
      </div>
    );
  }
}

TexterStats.propTypes = {
  campaignId: PropTypes.string.isRequired
};

const queries = {
  data: {
    query: gql`
      query getCampaign(
        $campaignId: String!
        $contactsFilter: ContactsFilter!
      ) {
        campaign(id: $campaignId) {
          id
          useDynamicAssignment
          assignments {
            id
            texter {
              id
              firstName
              lastName
            }
            unmessagedCount: contactsCount(contactsFilter: $contactsFilter)
            contactsCount
          }
        }
      }
    `,
    options: (ownProps) => ({
      variables: {
        campaignId: ownProps.campaignId,
        contactsFilter: {
          messageStatus: "needsMessage"
        }
      }
    })
  }
};

export default loadData({ queries })(TexterStats);
