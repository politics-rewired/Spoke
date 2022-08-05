import FormControl from "@material-ui/core/FormControl";
import InputLabel from "@material-ui/core/InputLabel";
import MenuItem from "@material-ui/core/MenuItem";
import Select from "@material-ui/core/Select";
import { Organization, useGetOrganizationsQuery } from "@spoke/spoke-codegen";
import React, { useState } from "react";

import AdminPeople from "./AdminPeople";

const SuperAdminPeople: React.FC = (_props) => {
  const [organizationId, setOrganizationId] = useState<string>();
  const {
    data: organizationsData,
    loading: orgsLoading
  } = useGetOrganizationsQuery();
  if (orgsLoading) {
    return <div>"Loading..."</div>;
  }

  const handleOrgChanged = (event: React.ChangeEvent<{ value: string }>) => {
    setOrganizationId(event.target.value);
  };

  const organizations = organizationsData?.organizations ?? [];
  return (
    <div>
      <FormControl>
        <InputLabel id="organization-label">Organization</InputLabel>
        <Select
          style={{ width: 300 }}
          labelId="organization-label"
          value={organizationId}
          onChange={handleOrgChanged}
        >
          {organizations.map((org: Organization) => (
            <MenuItem key={org.id} value={org.id}>
              {org.name}
            </MenuItem>
          ))}
        </Select>
      </FormControl>
      {organizationId && <AdminPeople organizationId={organizationId} />}
    </div>
  );
};

export default SuperAdminPeople;
