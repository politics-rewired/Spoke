import { css, StyleSheet } from "aphrodite";
import gql from "graphql-tag";
import PropTypes from "prop-types";
import React from "react";
import Form from "react-formal";
import * as yup from "yup";

import GSForm from "../components/forms/GSForm";
import SpokeFormField from "../components/forms/SpokeFormField";
import { dataTest } from "../lib/attributes";
import theme from "../styles/theme";
import { loadData } from "./hoc/with-operations";

const styles = StyleSheet.create({
  infoContainer: {
    ...theme.layouts.greenBox,
    textAlign: "left",
    padding: 20
  },
  header: {
    ...theme.text.header,
    color: theme.colors.white,
    borderBottom: "1px solid white"
  },
  subtitle: {
    ...theme.text.body,
    color: theme.colors.darkGray,
    backgroundColor: theme.colors.lightGray
  },
  fromContactMessage: {
    ...theme.text.body,
    backgroundColor: theme.colors.lightGreen,
    textAlign: "right",
    padding: 5
  },
  message: {
    ...theme.text.body,
    textAlign: "left",
    padding: 5
  },
  formContainer: {
    width: "60%",
    backgroundColor: theme.colors.white,
    marginTop: 15,
    marginBottom: 15,
    paddingLeft: 15,
    paddingRight: 15,
    paddingBottom: 15,
    marginLeft: "auto",
    marginRight: "auto"
  }
});

class AdminReplySender extends React.Component {
  formSchema = yup.object({
    message: yup.string().required()
  });

  renderMessageSendingForm(contact) {
    return (
      <div key={contact.id} className={css(styles.infoContainer)}>
        <div className={css(styles.header)}>
          {`${contact.firstName} ${contact.lastName}: ${contact.cell}`}
        </div>
        <div className={css(styles.subtitle)}>
          {contact.messages.map((message) => (
            <div
              key={message.id}
              className={
                message.isFromContact
                  ? css(styles.fromContactMessage)
                  : css(styles.message)
              }
            >
              {message.text}
            </div>
          ))}
        </div>
        <div className={css(styles.formContainer)}>
          <GSForm
            schema={this.formSchema}
            onSubmit={async (formValues) => {
              await this.props.mutations.sendReply(
                contact.id,
                formValues.message
              );
            }}
          >
            <SpokeFormField
              {...dataTest("reply")}
              name="message"
              label="Reply"
              hintText="Reply"
              fullWidth
            />
            <Form.Button
              {...dataTest("send")}
              type="submit"
              label="Send"
              name="submit"
              secondary
              fullWidth
            />
          </GSForm>
        </div>
      </div>
    );
  }

  render() {
    const { data } = this.props;
    return (
      <div>
        {data.campaign.contacts.map((contact) => {
          if (
            contact.messageStatus === "messaged" ||
            contact.messageStatus === "convo"
          ) {
            return this.renderMessageSendingForm(contact);
          }
          return "";
        })}
      </div>
    );
  }
}

AdminReplySender.propTypes = {
  mutations: PropTypes.object.isRequired,
  data: PropTypes.object.isRequired
};

const queries = {
  data: {
    query: gql`
      query getCampaignMessages($campaignId: String!) {
        campaign(id: $campaignId) {
          id
          contacts {
            id
            firstName
            lastName
            cell
            messageStatus
            messages {
              id
              text
              isFromContact
            }
          }
        }
      }
    `,
    options: (ownProps) => ({
      variables: {
        campaignId: ownProps.match.params.campaignId
      }
    })
  }
};

const mutations = {
  sendReply: (_ownProps) => (contactId, message) => ({
    mutation: gql`
      mutation sendReply($contactId: String!, $message: String!) {
        sendReply(id: $contactId, message: $message) {
          id
          messages {
            id
            text
            isFromContact
          }
        }
      }
    `,
    variables: { contactId, message }
  })
};

export default loadData({
  queries,
  mutations
})(AdminReplySender);
