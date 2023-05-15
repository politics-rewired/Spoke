import TextField from "@material-ui/core/TextField";
import type { AutocompleteChangeReason } from "@material-ui/lab/Autocomplete";
import Autocomplete from "@material-ui/lab/Autocomplete";
import Skeleton from "@material-ui/lab/Skeleton";
import { useGetOrganizationsQuery } from "@spoke/spoke-codegen";
import React, { useMemo, useState } from "react";

export interface OrganizationSelectorProps {
  initialOrgId: string;
  onChange: (selectedOrgId: string) => Promise<void> | void;
}

export const OrganizationSelector: React.FC<OrganizationSelectorProps> = (
  props
) => {
  const [orgId, setOrgId] = useState<string>(props.initialOrgId);
  const [orgInput, setOrgInput] = useState<string>("");

  const { data, loading } = useGetOrganizationsQuery();
  const orgs = data?.organizations ?? [];

  const orgOptions = orgs.map((o) => o?.id);

  const orgLabelMap = useMemo(
    () => new Map(orgs?.map((o) => [o?.id, `${o?.id}: ${o?.name}`])),
    [orgs]
  );

  const handleOrgSelected = (
    _event: React.ChangeEvent<object>,
    value: string | null | undefined,
    _reason: AutocompleteChangeReason
  ) => {
    if (value) {
      setOrgId(value);
      props.onChange(value);
    }
  };

  if (loading) return <Skeleton />;
  return (
    <Autocomplete
      value={orgId}
      options={orgOptions}
      inputValue={orgInput}
      getOptionLabel={(option) => orgLabelMap.get(option) ?? ""}
      onInputChange={(_event, newValue) => {
        setOrgInput(newValue);
      }}
      renderInput={(params) => (
        <TextField
          {...params}
          label="Organization"
          helperText="Which organization?"
        />
      )}
      onChange={handleOrgSelected}
    />
  );
};

export default OrganizationSelector;
