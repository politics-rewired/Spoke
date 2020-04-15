import React from "react";
import gql from "graphql-tag";
import * as yup from "yup";
import Form from "react-formal";
import moment from "moment";
import isEmpty from "lodash/isEmpty";

import { compose } from "recompose";
import { ApolloQueryResult } from "apollo-client";

import Autocomplete from "material-ui/AutoComplete";

import {
  asSection,
  RequiredComponentProps
} from "../components/SectionWrapper";
import { DataSourceItemType } from "../types";
import { loadData } from "../../hoc/with-operations";
import { difference } from "../../../lib/utils";
import { dataSourceItem } from "../../../components/utils";
import GSForm from "../../../components/forms/GSForm";
import CampaignFormSectionHeading from "../components/CampaignFormSectionHeading";

// Constants

const formSchema = yup.object({
  textingHoursStart: yup.number().integer(),
  textingHoursEnd: yup.number().integer(),
  timezone: yup.string().required()
});

const formatHour = (hour: number) => moment(hour, "H").format("h a");
const hourChoices = [...Array(24)].map((_, hour) =>
  dataSourceItem(formatHour(hour), hour)
);

const timezones = [
  "US/Alaska",
  "US/Aleutian",
  "US/Arizona",
  "US/Central",
  "US/East-Indiana",
  "US/Eastern",
  "US/Hawaii",
  "US/Indiana-Starke",
  "US/Michigan",
  "US/Mountain",
  "US/Pacific",
  "US/Samoa",
  "America/Puerto_Rico",
  "America/Virgin"
];

const timezoneChoices = timezones.map(timezone =>
  dataSourceItem(timezone, timezone)
);

// Types

interface TextingHoursValues {
  textingHoursStart: number;
  textingHoursEnd: number;
  timezone: string;
}

interface AutoassignHocProps {
  data: {
    campaign: TextingHoursValues & {
      id: string;
    };
  };
  mutations: {
    editCampaign(payload: Partial<TextingHoursValues>): ApolloQueryResult<any>;
  };
}

interface AutoassignInnerProps
  extends RequiredComponentProps,
    AutoassignHocProps {}

interface AutoassignState {
  pendingChanges: Partial<TextingHoursValues>;
  timezoneSearchText?: string;
  textingHoursStartSearchText?: string;
  textingHoursEndSearchText?: string;
  isWorking: boolean;
}

// See https://github.com/DefinitelyTyped/DefinitelyTyped/issues/26635#issuecomment-400260278
const updateState = <K extends keyof AutoassignState>(
  key: K,
  value: AutoassignState[K]
) => (prevState: AutoassignState): AutoassignState => ({
  ...prevState,
  [key]: value
});

// Component

class CampaignTextingHoursForm extends React.Component<
  AutoassignInnerProps,
  AutoassignState
> {
  state = {
    pendingChanges: {},
    timezoneSearchText: undefined,
    textingHoursStartSearchText: undefined,
    textingHoursEndSearchText: undefined,
    isWorking: false
  };

  handleChange = (formValues: TextingHoursValues) => {
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
      this.setState({
        isWorking: false,
        timezoneSearchText: undefined,
        textingHoursStartSearchText: undefined,
        textingHoursEndSearchText: undefined
      });
    }
  };

  addAutocompleteFormField = (
    name: keyof TextingHoursValues,
    stateName: keyof AutoassignState,
    value: string,
    label: string,
    hint: string,
    choices: DataSourceItemType[]
  ) => (
    <Form.Field
      name={name}
      type={Autocomplete}
      fullWidth
      dataSource={choices}
      filter={Autocomplete.caseInsensitiveFilter}
      maxSearchResults={4}
      searchText={
        this.state[stateName] !== undefined
          ? this.state[stateName]
          : value || ""
      }
      hintText={hint}
      floatingLabelText={label}
      onUpdateInput={(text: string) => {
        this.setState(updateState(stateName, text));
      }}
      onNewRequest={(selection: DataSourceItemType, index: number) => {
        // If enter was pressed, try to match current search text to an item
        let choice: DataSourceItemType | undefined = undefined;
        if (index === -1) {
          choice = choices.find(item => item.text === selection.text);
          if (!choice) return;
          selection = choice;
        }

        // Clear pending search term
        this.setState(updateState(stateName, undefined));
        // Update pendingChanges with selected value
        const { pendingChanges: existingChanges } = this.state;
        const updates = { [name]: selection.rawValue };
        const pendingChanges = Object.assign({}, existingChanges, updates);
        this.setState({ pendingChanges });
      }}
    />
  );

  render() {
    const { isWorking, pendingChanges } = this.state;
    const {
      isNew,
      saveLabel,
      data: { campaign }
    } = this.props;
    const { id: _id, ...formValues } = campaign;
    const value = Object.assign({}, formValues, pendingChanges);

    const hasPendingChanges = !isEmpty(pendingChanges);
    const isSaveDisabled = !isNew && !hasPendingChanges;
    const finalSaveLabel = isWorking ? "Working..." : saveLabel;

    return (
      <GSForm
        schema={formSchema}
        value={value}
        onChange={this.handleChange}
        onSubmit={this.handleSubmit}
      >
        <CampaignFormSectionHeading
          title="Texting hours for campaign"
          subtitle="Please configure texting hours for each campaign, noting the time zone of the individuals in the list you are uploading."
        />

        {this.addAutocompleteFormField(
          "textingHoursStart",
          "textingHoursStartSearchText",
          formatHour(value.textingHoursStart),
          "Start time",
          "Start typing a start time",
          hourChoices
        )}

        {this.addAutocompleteFormField(
          "textingHoursEnd",
          "textingHoursEndSearchText",
          formatHour(value.textingHoursEnd),
          "End time",
          "Start typing an end time",
          hourChoices
        )}

        {this.addAutocompleteFormField(
          "timezone",
          "timezoneSearchText",
          value.timezone,
          "Timezone to use for contacts without ZIP code and to determine daylight savings",
          "Start typing a timezone",
          timezoneChoices
        )}

        <Form.Button
          type="submit"
          disabled={isSaveDisabled}
          label={finalSaveLabel}
        />
      </GSForm>
    );
  }
}

const queries = {
  data: {
    query: gql`
      query getCampaignTextingHours($campaignId: String!) {
        campaign(id: $campaignId) {
          id
          textingHoursStart
          textingHoursEnd
          timezone
        }
      }
    `,
    options: (ownProps: AutoassignInnerProps) => ({
      variables: {
        campaignId: ownProps.campaignId
      }
    })
  }
};

const mutations = {
  editCampaign: (ownProps: AutoassignInnerProps) => (
    payload: Partial<TextingHoursValues>
  ) => ({
    mutation: gql`
      mutation editCampaignTextingHours(
        $campaignId: String!
        $payload: CampaignInput!
      ) {
        editCampaign(id: $campaignId, campaign: $payload) {
          id
          textingHoursStart
          textingHoursEnd
          timezone
          readiness {
            id
            textingHours
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

export default compose<AutoassignInnerProps, RequiredComponentProps>(
  loadData({
    queries,
    mutations
  }),
  asSection({
    title: "Texting Hours",
    readinessName: "textingHours",
    jobQueueNames: [],
    expandAfterCampaignStarts: true,
    expandableBySuperVolunteers: false
  })
)(CampaignTextingHoursForm);
