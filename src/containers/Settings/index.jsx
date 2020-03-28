import React from "react";

import { Tabs, Tab } from "material-ui/Tabs";
import SettingsIcon from "material-ui/svg-icons/action/settings";
import AlarmIcon from "material-ui/svg-icons/device/access-alarms";

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
      <Tab icon={<SettingsIcon />} label="General" value={"general"}>
        <br />
        <General match={match} />
      </Tab>
      {window.ENABLE_TROLLBOT && (
        <Tab
          icon={<AlarmIcon />}
          label="TrollBot Trigger Tokens"
          value={"trolltokens"}
        >
          <TrollTokenSettings match={match} isActive={page === "trolltokens"} />
        </Tab>
      )}
    </Tabs>
  );
};

export default SettingsRouter;
