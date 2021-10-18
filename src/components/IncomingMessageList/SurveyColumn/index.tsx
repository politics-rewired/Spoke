import { ApolloQueryResult } from "@apollo/client";
import gql from "graphql-tag";
import RaisedButton from "material-ui/RaisedButton";
import Snackbar from "material-ui/Snackbar";
import React, { Component } from "react";

import { loadData } from "../../../containers/hoc/with-operations";
import ManageSurveyResponses from "./ManageSurveyResponses";
import ManageTags from "./ManageTags";

const styles: { [key: string]: React.CSSProperties } = {
  container: {
    display: "flex",
    flexDirection: "column",
    flexGrow: 1
  },
  spacer: { flex: "1" }
};

interface Props {
  organizationId: string;
  campaign: any;
  contact: any;
}

interface HocProps {
  mutations: {
    closeConversation(): ApolloQueryResult<any>;
  };
}

interface State {
  isWorking: boolean;
  errorMessage?: string;
}

class SurveyColumn extends Component<Props & HocProps, State> {
  state: State = {
    isWorking: false,
    errorMessage: undefined
  };

  handleClickClose = async () => {
    this.setState({ isWorking: true });
    try {
      const response = await this.props.mutations.closeConversation();
      if (response.errors) throw response.errors;
    } catch (err) {
      this.setState({ errorMessage: err.message });
    } finally {
      this.setState({ isWorking: false });
    }
  };

  handleDismissError = () => this.setState({ errorMessage: undefined });

  render() {
    const { campaign, contact, organizationId } = this.props;
    const { isWorking, errorMessage } = this.state;

    return (
      <div style={styles.container}>
        <ManageSurveyResponses contact={contact} campaign={campaign} />
        <div style={styles.spacer} />
        <div style={{ display: "flex" }}>
          <div style={styles.spacer} />
          <RaisedButton
            label="End Conversation"
            disabled={isWorking}
            style={{ marginRight: "10px" }}
            onClick={this.handleClickClose}
          />
          <ManageTags organizationId={organizationId} contactId={contact.id} />
        </div>
        <Snackbar
          open={errorMessage !== undefined}
          message={errorMessage || ""}
          onRequestClose={this.handleDismissError}
          autoHideDuration={4000}
        />
      </div>
    );
  }
}

const mutations = {
  closeConversation: (ownProps: Props) => () => ({
    mutation: gql`
      mutation closeConversation(
        $campaignContactId: String!
        $messageStatus: String!
      ) {
        editCampaignContactMessageStatus(
          messageStatus: $messageStatus
          campaignContactId: $campaignContactId
        ) {
          id
          messageStatus
        }
      }
    `,
    variables: {
      campaignContactId: ownProps.contact.id,
      messageStatus: "closed"
    },
    refetchQueries: ["getContactTags"]
  })
};

export default loadData({
  mutations
})(SurveyColumn);
