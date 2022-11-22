import Button from "@material-ui/core/Button";
import TextField from "@material-ui/core/TextField";
import Tooltip from "@material-ui/core/Tooltip";
import Autocomplete from "@material-ui/lab/Autocomplete";
import Toggle from "material-ui/Toggle";
import PropTypes from "prop-types";
import React from "react";
import * as yup from "yup";

import GSForm from "../../../components/forms/GSForm";
import SpokeFormField from "../../../components/forms/SpokeFormField";
import CampaignFormSectionHeading from "../components/CampaignFormSectionHeading";

const formSchema = yup.object({
  isAssignmentLimitedToTeams: yup.boolean()
});

const styles = {
  button: {
    display: "inline-block",
    marginTop: 15
  }
};

class CampaignTeamsForm extends React.Component {
  onIsAssignmentLimitedToTeamsDidToggle = (
    _event,
    isAssignmentLimitedToTeams
  ) => {
    this.props.onChange({ isAssignmentLimitedToTeams });
  };

  handleChange = (_event, value) => {
    this.props.onChange({ teams: value });
  };

  render() {
    const {
      saveLabel,
      saveDisabled,
      formValues,
      orgTeams,
      onChange
    } = this.props;

    const teamsAdded = formValues.teams.length > 0;

    return (
      <div>
        <GSForm schema={formSchema} value={formValues} onChange={onChange}>
          <CampaignFormSectionHeading
            title="Teams for campaign"
            subtitle="Optionally prioritize assigning texters from specific teams for this campaign by selecting them below. Restrict assignment solely to members of selected teams by using the toggle below."
          />

          <Autocomplete
            multiple
            options={orgTeams}
            getOptionLabel={(team) => team.title}
            value={formValues.teams}
            filterSelectedOptions
            onChange={this.handleChange}
            getOptionSelected={(option, value) => option.id === value.id}
            renderInput={(params) => (
              <TextField
                {...params}
                variant="standard"
                label="Select Teams"
                placeholder="Select Teams"
                name="select-teams-autocomplete"
              />
            )}
          />
          <br />

          <Tooltip
            title="Select a team in order to restrict assignments solely to members of those teams"
            disableFocusListener={teamsAdded}
            disableHoverListener={teamsAdded}
            disableTouchListener={teamsAdded}
            placement="top-start"
          >
            <span>
              <SpokeFormField
                name="isAssignmentLimitedToTeams"
                disabled={!teamsAdded}
                type={Toggle}
                toggled={formValues.isAssignmentLimitedToTeams}
                label="Restrict assignment solely to members of these teams?"
                onToggle={this.onIsAssignmentLimitedToTeamsDidToggle}
              />
            </span>
          </Tooltip>
        </GSForm>
        <Button
          variant="contained"
          style={styles.button}
          disabled={saveDisabled}
          onClick={this.props.onSubmit}
        >
          {saveLabel}
        </Button>
      </div>
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
