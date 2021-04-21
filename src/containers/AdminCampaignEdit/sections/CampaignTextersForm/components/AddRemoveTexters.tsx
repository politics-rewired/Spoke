import Button from "@material-ui/core/Button";
import TextField from "@material-ui/core/TextField";
import Autocomplete from "@material-ui/lab/Autocomplete";
import React from "react";

import { dataTest } from "../../../../../lib/attributes";
import { OrgTexter, Texter } from "../types";

const inlineStyles = {
  autocomplete: {
    width: 300,
    marginBottom: 24
  }
};

interface Props {
  orgTexters: OrgTexter[];
  texters: Texter[];
  onAddTexters: (texters: OrgTexter[]) => Promise<void> | void;
  onRemoveEmptyTexters: () => Promise<void> | void;
}

export const AddRemoveTexters: React.FC<Props> = (props) => {
  const { orgTexters, texters, onAddTexters, onRemoveEmptyTexters } = props;

  const assignedTexterIds = new Set(texters.map(({ id }) => id));
  const availableTexters = orgTexters.filter(
    ({ id: orgTexterId }) => !assignedTexterIds.has(orgTexterId)
  );

  const handleSelectTexter = (
    _event: React.ChangeEvent<unknown>,
    value: OrgTexter | null
  ) => {
    if (value) onAddTexters([value]);
  };

  const handleAddAllTexters = () => onAddTexters(availableTexters);
  const handleRemoveEmptyTexters = () => onRemoveEmptyTexters();

  return (
    <div style={{ display: "flex", justifyContent: "space-between" }}>
      <Autocomplete<OrgTexter>
        id="texter-select"
        value={null}
        options={availableTexters}
        getOptionLabel={(option) => option.displayName}
        renderInput={(params) => (
          <TextField
            {...params}
            label="Add texter"
            helperText="Search for texters to assign"
            variant="outlined"
          />
        )}
        style={inlineStyles.autocomplete}
        onChange={handleSelectTexter}
      />
      <div>
        <Button
          varient="contained"
          {...dataTest("addAll")}
          onClick={handleAddAllTexters}
        >
          Add All
        </Button>
        <Button
          varient="contained"
          {...dataTest("removeEmtpy")}
          onClick={handleRemoveEmptyTexters}
        >
          Remove Empty
        </Button>
      </div>
    </div>
  );
};

export default AddRemoveTexters;
