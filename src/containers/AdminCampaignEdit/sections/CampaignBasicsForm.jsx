import PropTypes from "prop-types";
import React from "react";
import gql from "graphql-tag";
import Form from "react-formal";
import * as yup from "yup";
import moment from "moment";
import isEmpty from "lodash/isEmpty";

import RaisedButton from "material-ui/RaisedButton";
import ColorPicker from "material-ui-color-picker";

import { loadData } from "../../hoc/with-operations";
import { difference } from "../../../lib/utils";
import { dataTest } from "../../../lib/attributes";
import GSForm from "../../../components/forms/GSForm";
import SectionWrapper from "../components/SectionWrapper";
import CampaignFormSectionHeading from "./components/CampaignFormSectionHeading";

export const SECTION_OPTIONS = {
  blocksStarting: true,
  expandAfterCampaignStarts: true,
  expandableBySuperVolunteers: true
};

const schemaForIsStarted = mustBeComplete =>
  yup.object({
    title: mustBeComplete ? yup.string().required() : yup.string(),
    description: mustBeComplete ? yup.string().required() : yup.string(),
    dueBy: mustBeComplete ? yup.mixed().required() : yup.mixed(),
    logoImageUrl: yup
      .string()
      .url()
      .transform(value => value || null)
      .nullable(),
    primaryColor: yup
      .string()
      .transform(value => value || null)
      .nullable(),
    introHtml: yup
      .string()
      .transform(value => value || null)
      .nullable()
  });

class CampaignBasicsForm extends React.Component {
  state = {
    pendingChanges: {},
    isWorking: false
  };

  handleChange = formValues => {
    const { campaign } = this.props.campaignData;
    const pendingChanges = difference(formValues, campaign);
    this.setState({ pendingChanges });
  };

  handleSubmit = async () => {
    const { pendingChanges } = this.state;
    const { editBasics } = this.props.mutations;

    this.setState({ isWorking: true });
    try {
      const response = await editBasics(pendingChanges);
      if (response.errors) throw response.errors;
      this.setState({ pendingChanges: {} });
      this.props.onComplete();
    } catch (err) {
      this.props.onError(err.message);
    } finally {
      this.setState({ isWorking: false });
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
      value.title !== "" && value.description !== "" && value.dueBy !== null;
    const isSectionSaved = !hasPendingChanges;
    const sectionIsDone = isSectionComplete && isSectionSaved;

    const finalSaveLabel = isWorking ? "Working..." : saveLabel;

    return (
      <SectionWrapper
        title="Basics"
        expandable={expandable}
        active={active}
        saving={isSaving}
        done={sectionIsDone}
        adminPerms={adminPerms}
        pendingJob={jobs[0]}
        onExpandChange={onExpandChange}
        onDiscardJob={onDiscardJob}
      >
        <CampaignFormSectionHeading title="What's your campaign about?" />
        <GSForm
          schema={schemaForIsStarted(isStarted)}
          value={value}
          onChange={this.handleChange}
          onSubmit={this.handleSubmit}
        >
          <Form.Field
            {...dataTest("title")}
            name="title"
            label="Title"
            hintText="e.g. Election Day 2016"
            fullWidth
          />
          <Form.Field
            {...dataTest("description")}
            name="description"
            label="Description"
            hintText="Get out the vote"
            fullWidth
          />
          <Form.Field
            {...dataTest("dueBy")}
            name="dueBy"
            label="Due date"
            type="date"
            locale="en-US"
            shouldDisableDate={date => moment(date).diff(moment()) < 0}
            autoOk
            fullWidth
            utcOffset={0}
          />
          <Form.Field name="introHtml" label="Intro HTML" multiLine fullWidth />
          <Form.Field
            name="logoImageUrl"
            label="Logo Image URL"
            hintText="https://www.mysite.com/images/logo.png"
            fullWidth
          />
          <label>Primary color</label>
          <Form.Field
            name="primaryColor"
            label="Primary color"
            defaultValue={value.primaryColor || "#ffffff"}
            type={ColorPicker}
          />
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

CampaignBasicsForm.propTypes = {
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
    editBasics: PropTypes.func.isRequired
  }).isRequired,
  campaignData: PropTypes.shape({
    campaign: PropTypes.shape({
      id: PropTypes.string.isRequired,
      isStarted: PropTypes.bool.isRequired,
      title: PropTypes.string,
      description: PropTypes.string,
      dueBy: PropTypes.any,
      logoImageUrl: PropTypes.string,
      primaryColor: PropTypes.string,
      introHtml: PropTypes.string
    }).isRequired
  }).isRequired
};

const queries = {
  campaignData: {
    query: gql`
      query getCampaign($campaignId: String!) {
        campaign(id: $campaignId) {
          id
          title
          description
          dueBy
          logoImageUrl
          primaryColor
          introHtml
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
  editBasics: ownProps => campaign => ({
    mutation: gql`
      mutation editCampaign($campaignId: String!, $campaign: CampaignInput!) {
        editCampaign(id: $campaignId, campaign: $campaign) {
          id
          title
          description
          dueBy
          logoImageUrl
          primaryColor
          introHtml
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
})(CampaignBasicsForm);
