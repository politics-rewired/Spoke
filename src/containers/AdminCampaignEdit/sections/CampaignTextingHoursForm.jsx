import PropTypes from "prop-types";
import React from "react";
import gql from "graphql-tag";
import Form from "react-formal";
import * as yup from "yup";
import moment from "moment";
import isEmpty from "lodash/isEmpty";

import RaisedButton from "material-ui/RaisedButton";
import Autocomplete from "material-ui/AutoComplete";

import { loadData } from "../../hoc/with-operations";
import { difference } from "../../../lib/utils";
import { dataSourceItem } from "../../../components/utils";
import GSForm from "../../../components/forms/GSForm";
import SectionWrapper from "../components/SectionWrapper";
import CampaignFormSectionHeading from "./components/CampaignFormSectionHeading";

export const SECTION_OPTIONS = {
  blocksStarting: false,
  expandAfterCampaignStarts: true,
  expandableBySuperVolunteers: false
};

const formSchema = yup.object({
  textingHoursStart: yup.number().integer(),
  textingHoursEnd: yup.number().integer(),
  timezone: yup.string().required()
});

const formatHour = hour => moment(hour, "H").format("h a");
const hourChoices = new Array(24)
  .fill(null)
  .map((_, hour) => dataSourceItem(formatHour(hour), hour));

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

class CampaignTextingHoursForm extends React.Component {
  state = {
    pendingChanges: {},
    isWorking: false,
    timezoneSearchText: undefined,
    textingHoursStartSearchText: undefined,
    textingHoursEndSearchText: undefined
  };

  addAutocompleteFormField(name, stateName, value, label, hint, choices) {
    const searchText =
      this.state[stateName] !== undefined ? this.state[stateName] : value || "";
    return (
      <Form.Field
        name={name}
        type={Autocomplete}
        fullWidth
        dataSource={choices}
        filter={Autocomplete.caseInsensitiveFilter}
        maxSearchResults={4}
        searchText={searchText}
        hintText={hint}
        floatingLabelText={label}
        onUpdateInput={text => this.setState({ [stateName]: text })}
        onNewRequest={(selection, index) => {
          // If enter was pressed, try to match current search text to an item
          if (index === -1) {
            selection = choices.find(item => item.text === selection);
            if (!selection) return;
          }

          const { pendingChanges: existingChanges } = this.state;
          const updates = { [name]: selection.rawValue };
          const pendingChanges = Object.assign({}, existingChanges, updates);
          this.setState({ [stateName]: undefined, pendingChanges });
        }}
      />
    );
  }

  handleChange = formValues => {
    const { campaign } = this.props.campaignData;
    const pendingChanges = difference(formValues, campaign);
    this.setState({ pendingChanges });
  };

  handleSubmit = async () => {
    const { pendingChanges } = this.state;
    const { editTextingHours } = this.props.mutations;

    this.setState({ isWorking: true });
    try {
      const response = await editTextingHours(pendingChanges);
      if (response.errors) throw response.errors;
      this.setState({ pendingChanges: {} });
      this.props.onComplete();
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

  render() {
    const { pendingChanges, isWorking } = this.state;
    const {
      active,
      campaignData,
      isNew,
      adminPerms,
      saveLabel,
      jobs,
      onDiscardJob,
      onExpandChange
    } = this.props;
    const { campaign } = campaignData;
    const { id: _id, isStarted, ...formValues } = campaign;
    const value = Object.assign({}, formValues, pendingChanges);

    const userHasPermissions =
      adminPerms || SECTION_OPTIONS.expandableBySuperVolunteers;
    const sectionCanExpand =
      SECTION_OPTIONS.expandAfterCampaignStarts || !isStarted;
    const expandable = sectionCanExpand && userHasPermissions;

    const pendingJob = jobs[0];
    const isSaving = isWorking || !!pendingJob;
    const hasPendingChanges = !isEmpty(pendingChanges);
    const isSaveDisabled = isSaving || (!isNew && !hasPendingChanges);

    const isSectionComplete =
      value.textingHoursStart !== null &&
      value.textingHoursEnd !== null &&
      value.timezone !== null;
    const isSectionSaved = !hasPendingChanges;
    const sectionIsDone = isSectionComplete && isSectionSaved;

    const finalSaveLabel = isWorking ? "Working..." : saveLabel;

    return (
      <SectionWrapper
        title="Texting Hours"
        expandable={expandable}
        active={active}
        saving={isSaving}
        done={sectionIsDone}
        adminPerms={adminPerms}
        pendingJob={jobs[0]}
        onExpandChange={onExpandChange}
        onDiscardJob={onDiscardJob}
      >
        <CampaignFormSectionHeading
          title="Texting hours for campaign"
          subtitle="Please configure texting hours for each campaign, noting the time zone of the individuals in the list you are uploading."
        />
        <GSForm
          schema={formSchema}
          value={value}
          onChange={this.handleChange}
          onSubmit={this.handleSubmit}
        >
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
            label={finalSaveLabel}
            disabled={isSaveDisabled}
            component={RaisedButton}
          />
        </GSForm>
      </SectionWrapper>
    );
  }
}

CampaignTextingHoursForm.propTypes = {
  campaignId: PropTypes.string.isRequired,
  adminPerms: PropTypes.bool.isRequired,
  active: PropTypes.bool.isRequired,
  isNew: PropTypes.bool.isRequired,
  saveLabel: PropTypes.string.isRequired,
  jobs: PropTypes.arrayOf(PropTypes.object).isRequired,
  onExpandChange: PropTypes.func.isRequired,
  onDiscardJob: PropTypes.func.isRequired,
  onError: PropTypes.func.isRequired,
  onComplete: PropTypes.func.isRequired,

  // GraphQL props
  mutations: PropTypes.shape({
    editTextingHours: PropTypes.func.isRequired
  }).isRequired,
  campaignData: PropTypes.shape({
    campaign: PropTypes.shape({
      id: PropTypes.string.isRequired,
      isStarted: PropTypes.bool.isRequired,
      textingHoursStart: PropTypes.number,
      textingHoursEnd: PropTypes.number,
      timezone: PropTypes.string
    }).isRequired
  }).isRequired
};

const queries = {
  campaignData: {
    query: gql`
      query getCampaign($campaignId: String!) {
        campaign(id: $campaignId) {
          id
          textingHoursStart
          textingHoursEnd
          timezone
          isStarted
        }
      }
    `,
    options: ownProps => ({
      variables: {
        campaignId: ownProps.campaignId
      }
    })
  }
};

const mutations = {
  // TODO: this should fetch campaign.sectionProgress.basics
  editTextingHours: ownProps => campaign => ({
    mutation: gql`
      mutation editTextingHours(
        $campaignId: String!
        $campaign: CampaignInput!
      ) {
        editCampaign(id: $campaignId, campaign: $campaign) {
          id
          textingHoursStart
          textingHoursEnd
          timezone
        }
      }
    `,
    variables: {
      campaignId: ownProps.campaignId,
      campaign
    }
  })
};

export default loadData({
  queries,
  mutations
})(CampaignTextingHoursForm);
