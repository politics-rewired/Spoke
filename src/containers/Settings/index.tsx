import Tab from "@material-ui/core/Tab";
import Tabs from "@material-ui/core/Tabs";
import AccessAlarmsIcon from "@material-ui/icons/AccessAlarms";
import SettingsIcon from "@material-ui/icons/Settings";
import type { History } from "history";
import React from "react";
import type { match as MatchType } from "react-router-dom";

import TabPanel from "../../components/TabPanel";
import General from "./components/General";
import TrollTokenSettings from "./components/TrollTokenSettings";

interface SettingsRouterProps {
  history: History;
  match: MatchType<{ organizationId: string; page: string }>;
}

export const SettingsRouter: React.FC<SettingsRouterProps> = (props) => {
  const { match, history } = props;
  const { page, organizationId } = match.params;

  const onChangeActiveTab = (
    _event: React.ChangeEvent<any>,
    newPage: string
  ) => {
    history.push(`/admin/${organizationId}/settings/${newPage}`);
  };

  return (
    <>
      <Tabs value={page} variant="fullWidth" onChange={onChangeActiveTab}>
        <Tab icon={<SettingsIcon />} label="General" value="general" />
        {window.ENABLE_TROLLBOT && (
          <Tab
            icon={<AccessAlarmsIcon />}
            label="TrollBot Trigger Tokens"
            value="trolltokens"
          />
        )}
      </Tabs>
      <TabPanel value={page} index="general">
        <General match={match} />
      </TabPanel>
      <TabPanel value={page} index="trolltokens">
        <TrollTokenSettings match={match} isActive={page === "trolltokens"} />
      </TabPanel>
    </>
  );
};

export default SettingsRouter;
