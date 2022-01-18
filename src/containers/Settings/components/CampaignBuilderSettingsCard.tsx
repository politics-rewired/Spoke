import Card from "@material-ui/core/Card";
import CardContent from "@material-ui/core/CardContent";
import CardHeader from "@material-ui/core/CardHeader";
import FormControlLabel from "@material-ui/core/FormControlLabel";
import FormGroup from "@material-ui/core/FormGroup";
import Switch from "@material-ui/core/Switch";
import { ApolloQueryResult } from "apollo-client";
import React, { useState } from "react";
import { compose } from "recompose";

import { MutationMap, QueryMap } from "../../../network/types";
import { loadData } from "../../hoc/with-operations";
import {
  ConfirmationClickForScriptLinksType,
  EDIT_CONFIRMATION_CLICK_FOR_SCRIPT_LINKS,
  GET_CONFIRMATION_CLICK_FOR_SCRIPT_LINKS
} from "./queries";

interface HocProps {
  data: ConfirmationClickForScriptLinksType;
  mutations: {
    editConfirmationClickForScriptLinks(value: boolean): ApolloQueryResult<any>;
  };
}

export interface OuterProps {
  organizationId: string;
  style?: React.CSSProperties;
}

interface InnerProps extends OuterProps, HocProps {}

const CampaignBuilderSettingsCard: React.FC<InnerProps> = (props) => {
  const {
    data: {
      organization: {
        settings: { confirmationClickForScriptLinks }
      }
    },
    style
  } = props;
  const [working, setWorking] = useState<boolean>(false);
  const [errorMsg, setErrorMsg] = useState<string | undefined>(undefined);

  const saveConfirmationClickForLinks = async (
    _event: React.ChangeEvent<HTMLInputElement>,
    checked: boolean
  ) => {
    setErrorMsg(undefined);
    setWorking(true);
    try {
      const result = await props.mutations.editConfirmationClickForScriptLinks(
        checked
      );
      if (result.errors) throw new Error(result.errors[0].message);
    } catch (err: any) {
      console.log("setting error message", err.message);
      setErrorMsg(err.message);
    } finally {
      setWorking(false);
    }
  };

  return (
    <Card style={style}>
      <CardHeader title="Campaign Builder Settings" />
      <CardContent>
        {errorMsg && <p>Error: {errorMsg}</p>}
        <FormGroup row>
          <FormControlLabel
            control={
              <Switch
                checked={confirmationClickForScriptLinks}
                disabled={working}
                onChange={saveConfirmationClickForLinks}
              />
            }
            label="Require confirmation click for links in scripts?"
          />
        </FormGroup>
      </CardContent>
    </Card>
  );
};

const queries: QueryMap<OuterProps> = {
  data: {
    query: GET_CONFIRMATION_CLICK_FOR_SCRIPT_LINKS,
    options: ({ organizationId }) => ({
      variables: { organizationId }
    })
  }
};

const mutations: MutationMap<OuterProps> = {
  editConfirmationClickForScriptLinks: ({ organizationId }) => (
    confirmationClickForScriptLinks: boolean
  ) => ({
    mutation: EDIT_CONFIRMATION_CLICK_FOR_SCRIPT_LINKS,
    variables: {
      organizationId,
      input: {
        confirmationClickForScriptLinks
      }
    }
  })
};

export default compose<InnerProps, OuterProps>(
  loadData({ queries, mutations })
)(CampaignBuilderSettingsCard);
