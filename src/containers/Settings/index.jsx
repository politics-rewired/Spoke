import React from "react";
import { Tabs, Tab } from "material-ui/Tabs";

import General from "./components/General";
import TrollTokenSettings from "./components/TrollTokenSettings";

export const SettingsRouter = props => {
  const { match, history } = props;
  const { page, organizationId } = match.params;

  const handleOnChangeTab = page => {
    history.push(`/admin/${organizationId}/settings/${page}`);
  };

  return (
    <Tabs value={page} onChange={handleOnChangeTab}>
      <Tab label="General" value={"general"}>
        <br />
        <General match={match} />
      </Tab>
      <Tab label="TrollBot Tokens" value={"trolltokens"}>
        <TrollTokenSettings match={match} />
      </Tab>
    </Tabs>
  );
};

export default SettingsRouter;
