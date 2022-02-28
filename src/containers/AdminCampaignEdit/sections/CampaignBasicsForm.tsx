import { ApolloQueryResult, gql } from "@apollo/client";
import isEmpty from "lodash/isEmpty";
import ColorPicker from "material-ui-color-picker";
import IconButton from "material-ui/IconButton";
import RaisedButton from "material-ui/RaisedButton";
import DeleteIcon from "material-ui/svg-icons/action/delete";
import React from "react";
import { compose } from "recompose";
import * as yup from "yup";

import GSForm from "../../../components/forms/GSForm";
import SpokeFormField from "../../../components/forms/SpokeFormField";
import { dataTest } from "../../../lib/attributes";
import { DateTime } from "../../../lib/datetime";
import { difference } from "../../../lib/utils";
import { loadData } from "../../hoc/with-operations";
import CampaignFormSectionHeading from "../components/CampaignFormSectionHeading";
import {
  asSection,
  FullComponentProps,
  RequiredComponentProps
} from "../components/SectionWrapper";

interface BasicsValues {
  title?: string;
  description?: string;
  dueBy?: string | null;
  logoImageUrl?: string;
  primaryColor?: string;
  introHtml?: string;
}

interface BasicsHocProps {
  mutations: {
    editCampaign(payload: BasicsValues): ApolloQueryResult<any>;
  };
  data: {
    campaign: BasicsValues & {
      id: string;
      isStarted: boolean;
    };
  };
}

interface BasicsInnerProps extends FullComponentProps, BasicsHocProps {}

interface BasicsState {
  pendingChanges: BasicsValues;
  isWorking: boolean;
}

const schemaForIsStarted = (mustBeComplete: boolean) =>
  yup.object({
    title: mustBeComplete ? yup.string().required() : yup.string(),
    description: mustBeComplete ? yup.string().required() : yup.string(),
    dueBy: yup.mixed().nullable(),
    logoImageUrl: yup
      .string()
      .url()
      .transform((value: string) => value || null)
      .nullable(),
    primaryColor: yup
      .string()
      .transform((value: string) => value || null)
      .nullable(),
    introHtml: yup
      .string()
      .transform((value: string) => value || null)
      .nullable()
  });

class CampaignBasicsForm extends React.Component<
  BasicsInnerProps,
  BasicsState
> {
  state = {
    pendingChanges: {},
    isWorking: false
  };

  handleChange = (formValues: BasicsValues) => {
    const { campaign } = this.props.data;
    const pendingChanges = difference(formValues, campaign);
    this.setState({ pendingChanges });
  };

  handleSubmit = async () => {
    const { pendingChanges } = this.state;
    const { editCampaign } = this.props.mutations;

    this.setState({ isWorking: true });
    try {
      const response = await editCampaign(pendingChanges);
      if (response.errors) throw response.errors;
      this.setState({ pendingChanges: {} });
    } catch (err) {
      this.props.onError(err.message);
    } finally {
      this.setState({ isWorking: false });
    }
  };

  deleteDueDate = () => {
    const pendingChanges = { ...this.state.pendingChanges, dueBy: null };
    this.setState({ pendingChanges });
  };

  render() {
    const { pendingChanges, isWorking } = this.state;
    const {
      data: { campaign },
      isNew,
      saveLabel
    } = this.props;
    const { id: _id, isStarted, ...formValues } = campaign;
    const value = { ...formValues, ...pendingChanges };

    const hasPendingChanges = !isEmpty(pendingChanges);
    const isSaveDisabled = isWorking || (!isNew && !hasPendingChanges);

    const finalSaveLabel = isWorking ? "Working..." : saveLabel;

    return (
      <div>
        <GSForm
          schema={schemaForIsStarted(isStarted)}
          value={value}
          onChange={this.handleChange}
        >
          <CampaignFormSectionHeading title="What&#39;s your campaign about?" />

          <SpokeFormField
            {...dataTest("title")}
            name="title"
            label="Title"
            hintText="e.g. Election Day 2016"
            fullWidth
          />

          <SpokeFormField
            {...dataTest("description")}
            name="description"
            label="Description"
            hintText="Get out the vote"
            fullWidth
          />
          <div style={{ display: "inline-block", width: 256 }}>
            <SpokeFormField
              {...dataTest("dueBy")}
              name="dueBy"
              label="Due date"
              type="date"
              locale="en-US"
              shouldDisableDate={(date: Date) =>
                DateTime.fromJSDate(date) < DateTime.local()
              }
              autoOk
            />
          </div>
          <IconButton
            tooltip="Delete the Due Date"
            tooltipPosition="top"
            onClick={this.deleteDueDate}
            style={{ width: 50 }}
          >
            <DeleteIcon />
          </IconButton>

          <SpokeFormField
            name="introHtml"
            label="Intro HTML"
            multiLine
            fullWidth
          />
          <SpokeFormField
            name="logoImageUrl"
            label="Logo Image URL"
            hintText="https://www.mysite.com/images/logo.png"
            fullWidth
          />
          <p>Primary color</p>
          <SpokeFormField
            name="primaryColor"
            label="Primary color"
            defaultValue={value.primaryColor || "#ffffff"}
            type={ColorPicker}
          />
        </GSForm>

        <RaisedButton
          label={finalSaveLabel}
          disabled={isSaveDisabled}
          onClick={this.handleSubmit}
        />
      </div>
    );
  }
}

const queries = {
  data: {
    query: gql`
      query getCampaignBasics($campaignId: String!) {
        campaign(id: $campaignId) {
          id
          title
          description
          dueBy
          introHtml
          logoImageUrl
          primaryColor
          isStarted
        }
      }
    `,
    options: (ownProps: BasicsInnerProps) => ({
      variables: {
        campaignId: ownProps.campaignId
      }
    })
  }
};

const mutations = {
  editCampaign: (ownProps: BasicsInnerProps) => (payload: BasicsValues) => ({
    mutation: gql`
      mutation editCampaignBasics(
        $campaignId: String!
        $payload: CampaignInput!
      ) {
        editCampaign(id: $campaignId, campaign: $payload) {
          id
          title
          description
          dueBy
          introHtml
          logoImageUrl
          primaryColor
          isStarted
          readiness {
            id
            basics
          }
        }
      }
    `,
    variables: {
      campaignId: ownProps.campaignId,
      payload
    }
  })
};

export default compose<BasicsInnerProps, RequiredComponentProps>(
  asSection({
    title: "Basics",
    readinessName: "basics",
    jobQueueNames: [],
    expandAfterCampaignStarts: true,
    expandableBySuperVolunteers: true
  }),
  loadData({
    queries,
    mutations
  })
)(CampaignBasicsForm);
