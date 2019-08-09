import React from "react";
import PropTypes from "prop-types";
import * as yup from "yup";
import Form from "react-formal";
import Toggle from "material-ui/Toggle";
import ChipInput from "material-ui-chip-input";

import GSForm from "./forms/GSForm";
import CampaignFormSectionHeading from "./CampaignFormSectionHeading";

const formSchema = yup.object({
  isAssignmentLimitedToTeams: yup.boolean()
});

class CampaignTeamsForm extends React.Component {
  onIsAssignmentLimitedToTeamsDidToggle = (
    _event,
    isAssignmentLimitedToTeams
  ) => {
    const payload = { isAssignmentLimitedToTeams };
    if (!isAssignmentLimitedToTeams) payload.teams = [];
    this.props.onChange(payload);
  };

  addTeam = team => {
    const { teams } = this.props.formValues;

    const teanAlreadySelected =
      teams.filter(existingTeam => existingTeam.id === team.id).length > 0;

    if (!teanAlreadySelected) {
      teams.push(team);
    }

    this.props.onChange({ teams });
  };

  // Prevent user-defined tags
  handleBeforeRequestAdd = ({ id: tagId, title }) =>
    !isNaN(tagId) && tagId !== title;

  handleAddTeam = ({ id: teamId }) => {
    const { orgTeams } = this.props;

    const team = orgTeams.find(team => team.id === teamId);

    this.addTeam(team);
  };

  handleRemoveTeam = deleteTeamId => {
    const teams = this.props.formValues.teams.filter(
      team => team.id !== deleteTeamId
    );
    this.props.onChange({ teams });
  };

  render() {
    const {
      saveLabel,
      saveDisabled,
      formValues,
      orgTeams,
      onChange,
      onSubmit
    } = this.props;

    return (
      <GSForm
        schema={formSchema}
        value={formValues}
        onChange={onChange}
        onSubmit={onSubmit}
      >
        <CampaignFormSectionHeading
          title="Teams for campaign"
          subtitle="You may limit texter assignments for this campaign to specific teams."
        />

        <Form.Field
          name={"isAssignmentLimitedToTeams"}
          type={Toggle}
          toggled={formValues["isAssignmentLimitedToTeams"]}
          label={"Limit assignment to specific teams for this campaign?"}
          onToggle={this.onIsAssignmentLimitedToTeamsDidToggle}
        />

        <br />

        <ChipInput
          value={formValues.teams}
          dataSourceConfig={{ text: "title", value: "id" }}
          dataSource={orgTeams}
          placeholder="Select teams"
          fullWidth={true}
          openOnFocus={true}
          disabled={!formValues.isAssignmentLimitedToTeams}
          onBeforeRequestAdd={this.handleBeforeRequestAdd}
          onRequestAdd={this.handleAddTeam}
          onRequestDelete={this.handleRemoveTeam}
        />

        <Form.Button type="submit" disabled={saveDisabled} label={saveLabel} />
      </GSForm>
    );
  }
}

CampaignTeamsForm.propTypes = {
  formValues: PropTypes.object.isRequired,
  orgTeams: PropTypes.arrayOf(PropTypes.object).isRequired,
  saveDisabled: PropTypes.bool.isRequired,
  saveLabel: PropTypes.string.isRequired,
  onChange: PropTypes.func.isRequired,
  onSubmit: PropTypes.func.isRequired
};

export default CampaignTeamsForm;
