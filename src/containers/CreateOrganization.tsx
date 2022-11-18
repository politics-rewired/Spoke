import type { ApolloQueryResult } from "@apollo/client";
import { gql } from "@apollo/client";
import Card from "@material-ui/core/Card";
import CardActions from "@material-ui/core/CardActions";
import CardContent from "@material-ui/core/CardContent";
import CardHeader from "@material-ui/core/CardHeader";
import Container from "@material-ui/core/Container";
import Typography from "@material-ui/core/Typography";
import type { Invite, Organization, User } from "@spoke/spoke-codegen";
import React from "react";
import Form from "react-formal";
import type { RouteComponentProps } from "react-router-dom";
import { Link, withRouter } from "react-router-dom";
import { compose } from "recompose";
import * as yup from "yup";

import GSForm from "../components/forms/GSForm";
import SpokeFormField from "../components/forms/SpokeFormField";
import { dataTest } from "../lib/attributes";
import type { MutationMap, QueryMap } from "../network/types";
import { loadData } from "./hoc/with-operations";

interface HocProps extends RouteComponentProps<{ inviteId: string }> {
  mutations: {
    createOrganization: (
      name: string,
      userId: string,
      inviteId: string
    ) => Promise<
      ApolloQueryResult<{ createOrganization: Pick<Organization, "id"> }>
    >;
  };
  userData: {
    currentUser: User;
  };
  inviteData: {
    inviteByHash: Invite[];
  };
}

const CreateOrganization: React.FC<HocProps> = (props) => {
  const { mutations, history, match, userData, inviteData } = props;
  const invite = inviteData?.inviteByHash[0];
  const isValid = invite?.isValid || false;

  const formSchema = yup.object({
    name: yup.string().required()
  });

  const handleOnSubmit = async (formValues: { name: string }) => {
    if (!invite) return;
    const newOrganization = await mutations.createOrganization(
      formValues.name,
      userData.currentUser.id,
      invite.id
    );
    history.push(`/admin/${newOrganization.data.createOrganization.id}`);
  };

  return (
    <Container>
      <Card style={{ marginTop: "4em" }}>
        <CardHeader title="Spoke" />
        {isValid && (
          <GSForm schema={formSchema} onSubmit={handleOnSubmit}>
            <CardContent>
              Create your organization to get started.
              <SpokeFormField
                {...dataTest("organization")}
                name="name"
                label="Your organization"
                hintText="Bartlet Campaign"
                fullWidth
              />
            </CardContent>
            <CardActions>
              <Form.Submit
                type="submit"
                label="Get Started"
                value="Get Started"
                name="submit"
                fullWidth
                secondary
                style={{ marginTop: 40 }}
              />
            </CardActions>
          </GSForm>
        )}
        {!isValid && (
          <CardContent>
            <Typography>
              The invite code <code>{match.params.inviteId}</code> is no longer
              valid. This probably means it already got used! Return{" "}
              <Link to="/">home</Link>
            </Typography>
          </CardContent>
        )}
      </Card>
    </Container>
  );
};

const queries: QueryMap<HocProps> = {
  inviteData: {
    query: gql`
      query getInvite($inviteId: String!) {
        inviteByHash(hash: $inviteId) {
          id
          isValid
        }
      }
    `,
    options: (ownProps) => ({
      variables: {
        inviteId: ownProps.match.params.inviteId
      },
      fetchPolicy: "network-only"
    })
  },
  userData: {
    query: gql`
      query getCurrentUser {
        currentUser {
          id
        }
      }
    `,
    options: (_ownProps) => ({ fetchPolicy: "network-only" })
  }
};

const mutations: MutationMap<HocProps> = {
  createOrganization: (_ownProps) => (
    name: string,
    userId: string,
    inviteId: string
  ) => ({
    mutation: gql`
      mutation createOrganization(
        $name: String!
        $userId: String!
        $inviteId: String!
      ) {
        createOrganization(name: $name, userId: $userId, inviteId: $inviteId) {
          id
        }
      }
    `,
    variables: { name, userId, inviteId }
  })
};

export default compose(
  withRouter,
  loadData({
    queries,
    mutations
  })
)(CreateOrganization);
