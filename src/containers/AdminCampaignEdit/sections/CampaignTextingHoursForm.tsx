import type { ApolloQueryResult } from "@apollo/client";
import { gql } from "@apollo/client";
import Button from "@material-ui/core/Button";
import isEmpty from "lodash/isEmpty";
import Autocomplete from "material-ui/AutoComplete";
import React from "react";
import { compose } from "recompose";
import * as yup from "yup";

import GSForm from "../../../components/forms/GSForm";
import SpokeFormField from "../../../components/forms/SpokeFormField";
import type { DataSourceItemType } from "../../../components/utils";
import { dataSourceItem } from "../../../components/utils";
import { DateTime, parseIanaZone } from "../../../lib/datetime";
import { timezones } from "../../../lib/timezones";
import { difference } from "../../../lib/utils";
import { loadData } from "../../hoc/with-operations";
import CampaignFormSectionHeading from "../components/CampaignFormSectionHeading";
import type {
  FullComponentProps,
  RequiredComponentProps
} from "../components/SectionWrapper";
import { asSection } from "../components/SectionWrapper";

// Constants

const formSchema = yup.object({
  textingHoursStart: yup.number().integer(),
  textingHoursEnd: yup.number().integer(),
  timezone: yup.string().required()
});

const formatHour = (hour: number) =>
  DateTime.local().set({ hour }).toFormat("h a");
const hourChoices = [...Array(24)].map((_, hour) =>
  dataSourceItem(formatHour(hour), hour)
);

const timezoneChoices = timezones.map((timezone: string) =>
  dataSourceItem(timezone, parseIanaZone(timezone))
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

interface AutoassignInnerProps extends FullComponentProps, AutoassignHocProps {}

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

  addAutocompleteFormField = <T,>(
    name: keyof TextingHoursValues,
    stateName: keyof AutoassignState,
    value: T,
    label: string,
    hint: string,
    choices: DataSourceItemType<T>[]
  ) => (
    <SpokeFormField
      name={name}
      type={Autocomplete}
      fullWidth
      dataSource={choices.map(({ text, rawValue }) => ({
        text,
        value: rawValue
      }))}
      filter={Autocomplete.caseInsensitiveFilter}
      searchText={
        this.state[stateName] !== undefined
          ? this.state[stateName]
          : choices.find((choice) => choice.rawValue === value)?.text || ""
      }
      hintText={hint}
      floatingLabelText={label}
      onUpdateInput={(text: string) => {
        this.setState(updateState(stateName, text));
      }}
      onNewRequest={(
        selection: {
          text: string;
          value: T;
        },
        index: number
      ) => {
        // If enter was pressed, try to match current search text to an item
        let choice: DataSourceItemType<T> | undefined;
        if (index === -1) {
          choice = choices.find((item) => item.text === selection.text);
          if (!choice) return;
          selection = { text: choice.text, value: choice.rawValue };
        }

        // Clear pending search term
        this.setState(updateState(stateName, undefined));
        // Update pendingChanges with selected value
        const { pendingChanges: existingChanges } = this.state;
        const updates = { [name]: selection.value };
        const pendingChanges = { ...existingChanges, ...updates };
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
    const value = { ...formValues, ...pendingChanges };

    const hasPendingChanges = !isEmpty(pendingChanges);
    const isSaveDisabled = !isNew && !hasPendingChanges;
    const finalSaveLabel = isWorking ? "Working..." : saveLabel;

    return (
      <div>
        <GSForm schema={formSchema} value={value} onChange={this.handleChange}>
          <CampaignFormSectionHeading
            title="Texting hours for campaign"
            subtitle="Please configure texting hours for each campaign, noting the time zone of the individuals in the list you are uploading."
          />

          {this.addAutocompleteFormField(
            "textingHoursStart",
            "textingHoursStartSearchText",
            value.textingHoursStart,
            "Start time",
            "Start typing a start time",
            hourChoices
          )}

          {this.addAutocompleteFormField(
            "textingHoursEnd",
            "textingHoursEndSearchText",
            value.textingHoursEnd,
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
        </GSForm>
        <Button
          variant="contained"
          disabled={isSaveDisabled}
          onClick={this.handleSubmit}
        >
          {finalSaveLabel}
        </Button>
      </div>
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
  asSection({
    title: "Texting Hours",
    readinessName: "textingHours",
    jobQueueNames: [],
    expandAfterCampaignStarts: true,
    expandableBySuperVolunteers: false
  }),
  loadData({
    queries,
    mutations
  })
)(CampaignTextingHoursForm);
