import { gql } from "@apollo/client";
import type { CampaignContact, Message } from "@spoke/spoke-codegen";
import { css, StyleSheet } from "aphrodite/no-important";
import muiThemeable from "material-ui/styles/muiThemeable";
import React from "react";
import Form from "react-formal";
import type { match } from "react-router-dom";
import { compose } from "recompose";
import * as yup from "yup";

import GSForm from "../components/forms/GSForm";
import SpokeFormField from "../components/forms/SpokeFormField";
import { dataTest } from "../lib/attributes";
import type { MutationMap, QueryMap } from "../network/types";
import baseTheme from "../styles/theme";
import type { MuiThemeProviderProps } from "../styles/types";
import { loadData } from "./hoc/with-operations";

const styles = StyleSheet.create({
  infoContainer: {
    ...baseTheme.layouts.greenBox,
    textAlign: "left",
    padding: 20
  },
  header: {
    ...baseTheme.text.header,
    color: baseTheme.colors.white,
    borderBottom: "1px solid white"
  },
  subtitle: {
    ...baseTheme.text.body,
    color: baseTheme.colors.darkGray,
    backgroundColor: baseTheme.colors.lightGray
  },
  fromContactMessage: {
    ...baseTheme.text.body,
    backgroundColor: baseTheme.colors.lightGreen,
    textAlign: "right",
    padding: 5
  },
  message: {
    ...baseTheme.text.body,
    textAlign: "left",
    padding: 5
  },
  formContainer: {
    width: "60%",
    backgroundColor: baseTheme.colors.white,
    marginTop: 15,
    marginBottom: 15,
    paddingLeft: 15,
    paddingRight: 15,
    paddingBottom: 15,
    marginLeft: "auto",
    marginRight: "auto"
  }
});

type Contact = Pick<
  CampaignContact,
  "id" | "firstName" | "lastName" | "cell" | "messageStatus"
> & {
  messages: Pick<Message, "id" | "text" | "isFromContact">[];
};

interface InnerProps extends MuiThemeProviderProps {
  match: match<{ campaignId: string }>;
  mutations: {
    sendReply: (contactId: string, message: string) => Promise<void>;
  };
  data: {
    campaign: {
      id: string;
      contacts: Contact[];
    };
  };
}

class AdminReplySender extends React.Component<InnerProps> {
  formSchema = yup.object({
    message: yup.string().required()
  });

  renderMessageSendingForm(contact: Contact) {
    const { muiTheme } = this.props;

    const overrides = {
      container: {
        backgroundColor:
          muiTheme?.palette?.primary1Color ?? baseTheme.colors.green
      }
    };

    return (
      <div
        key={contact.id}
        className={css(styles.infoContainer)}
        style={overrides.container}
      >
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
            onSubmit={async (formValues: { message: string }) => {
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
            <Form.Submit
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

const queries: QueryMap<InnerProps> = {
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

const mutations: MutationMap<never> = {
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

export default compose<InnerProps, never>(
  muiThemeable(),
  loadData({
    queries,
    mutations
  })
)(AdminReplySender);
