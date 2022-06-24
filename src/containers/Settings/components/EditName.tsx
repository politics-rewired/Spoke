import { ApolloQueryResult } from "@apollo/client";
import Button from "@material-ui/core/Button";
import Card from "@material-ui/core/Card";
import CardActions from "@material-ui/core/CardActions";
import CardContent from "@material-ui/core/CardContent";
import CardHeader from "@material-ui/core/CardHeader";
import TextField from "material-ui/TextField";
import React, { useState } from "react";
import { compose } from "recompose";

import { MutationMap, QueryMap } from "../../../network/types";
import { loadData } from "../../hoc/with-operations";
import {
  EDIT_ORGANIZATION_NAME,
  GET_ORGANIZATION_NAME,
  OrganizationNameType
} from "./queries";

interface HocProps {
  data: OrganizationNameType;
  mutations: {
    editName(name: string): ApolloQueryResult<any>;
    deleteConfig(id: string): ApolloQueryResult<any>;
  };
}

export interface OuterProps {
  organizationId: string;
  style?: React.CSSProperties;
}

interface InnerProps extends OuterProps, HocProps {}

const EditName: React.FC<InnerProps> = (props) => {
  const {
    data: {
      organization: { name }
    },
    style
  } = props;
  const [orgName, setOrgName] = useState<string | undefined>(undefined);
  const [working, setWorking] = useState<boolean>(false);
  const [errorMsg, setErrorMsg] = useState<string | undefined>(undefined);

  const value = orgName ?? name;
  const isDifferent = orgName && orgName !== name;

  const handleNameChange = (e: React.FormEvent<unknown>, newValue: string) =>
    setOrgName(newValue);

  const saveOrganizationName = async () => {
    if (!orgName || orgName === name) return;

    setErrorMsg(undefined);
    setWorking(true);
    try {
      const result = await props.mutations.editName(orgName);
      if (result.errors) throw new Error(result.errors[0].message);
    } catch (err) {
      console.log("setting error message", err.message);
      setErrorMsg(err.message);
    } finally {
      setWorking(false);
    }
  };

  return (
    <Card style={style}>
      <CardHeader
        titleTypographyProps={{ variant: "body1" }}
        title="Organization Name"
      />
      <CardContent>
        {errorMsg && <p>Error: {errorMsg}</p>}
        <TextField
          floatingLabelText="Organization Name"
          value={value}
          onChange={handleNameChange}
        />
      </CardContent>
      <CardActions>
        <Button
          variant="contained"
          color="primary"
          disabled={working || !isDifferent}
          onClick={saveOrganizationName}
        >
          Save Name
        </Button>
      </CardActions>
    </Card>
  );
};

const queries: QueryMap<OuterProps> = {
  data: {
    query: GET_ORGANIZATION_NAME,
    options: ({ organizationId }) => ({
      variables: { organizationId }
    })
  }
};

const mutations: MutationMap<OuterProps> = {
  editName: ({ organizationId }) => (name: string) => ({
    mutation: EDIT_ORGANIZATION_NAME,
    variables: {
      organizationId,
      input: {
        name
      }
    }
  })
};

export default compose<InnerProps, OuterProps>(
  loadData({ queries, mutations })
)(EditName);
