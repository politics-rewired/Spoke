import ChipInput from "material-ui-chip-input";
import Toggle from "material-ui/Toggle";
import PropTypes from "prop-types";
import React from "react";
import Form from "react-formal";
import * as yup from "yup";

import GSForm from "../../../components/forms/GSForm";
import CampaignFormSectionHeading from "../components/CampaignFormSectionHeading";

const formSchema = yup.object({
  isAssignmentLimitedToTeams: yup.boolean()
});

class CampaignTeamsForm extends React.Component {
  onIsAssignmentLimitedToTeamsDidToggle = (
    _event,
    isAssignmentLimitedToTeams
  ) => {
    this.props.onChange({ isAssignmentLimitedToTeams });
  };

  addTeam = (team) => {
    const { teams } = this.props.formValues;

    const teanAlreadySelected =
      teams.filter((existingTeam) => existingTeam.id === team.id).length > 0;

    if (!teanAlreadySelected) {
      teams.push(team);
    }

    this.props.onChange({ teams });
  };

  // Prevent user-defined teams
  handleBeforeRequestAdd = ({ id: tagId, title }) =>
    !Number.isNaN(tagId) && tagId !== title;

  handleAddTeam = ({ id: teamId }) => {
    const { orgTeams } = this.props;

    const team = orgTeams.find((orgTeam) => orgTeam.id === teamId);

    this.addTeam(team);
  };

  handleRemoveTeam = (deleteTeamId) => {
    const teams = this.props.formValues.teams.filter(
      (team) => team.id !== deleteTeamId
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
          subtitle="Optionally prioritize assigning texters from specific teams for this campaign by selecting them below. Restrict assignment solely to members of selected teams by using the toggle below."
        />

        <ChipInput
          value={formValues.teams}
          dataSourceConfig={{ text: "title", value: "id" }}
          dataSource={orgTeams}
          placeholder="Select teams"
          fullWidth
          openOnFocus
          onBeforeRequestAdd={this.handleBeforeRequestAdd}
          onRequestAdd={this.handleAddTeam}
          onRequestDelete={this.handleRemoveTeam}
        />

        <br />

        <Form.Field
          name="isAssignmentLimitedToTeams"
          type={Toggle}
          toggled={formValues.isAssignmentLimitedToTeams}
          label="Restrict assignment solely to members of these teams?"
          onToggle={this.onIsAssignmentLimitedToTeamsDidToggle}
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
