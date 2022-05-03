import ListItemText from "@material-ui/core/ListItemText";
import Menu from "@material-ui/core/Menu";
import MenuItem from "@material-ui/core/MenuItem";
import React from "react";

import { useGetCannedResponses } from "./hooks";
import type { AssignmentIdOrCampaignId } from "./types";

type CannedResponseMenuProps = {
  anchorEl?: Element;
  onSelectCannedResponse?: (script: string) => Promise<void> | void;
  onRequestClose?: () => Promise<void> | void;
} & AssignmentIdOrCampaignId;

const CannedResponseMenu: React.FC<CannedResponseMenuProps> = (props) => {
  const {
    anchorEl,
    onSelectCannedResponse,
    onRequestClose,
    children: _children,
    ...ids
  } = props;

  const { data, loading, error } = useGetCannedResponses(ids);

  const handleOnClickFactory = (script: string) => () =>
    onSelectCannedResponse?.(script);

  const cannedResponses = data?.cannedResponses ?? [];

  return (
    <Menu
      anchorEl={anchorEl}
      keepMounted
      open={Boolean(anchorEl)}
      onClose={onRequestClose}
    >
      {loading && (
        <MenuItem disabled>
          <ListItemText primary="Loading..." />
        </MenuItem>
      )}
      {error && (
        <MenuItem disabled>
          <ListItemText primary={`Error: ${error.message}`} />
        </MenuItem>
      )}
      {cannedResponses.length === 0 && (
        <MenuItem disabled>
          <ListItemText primary="No canned responses for this campaign" />
        </MenuItem>
      )}
      {cannedResponses.map((response) => {
        return (
          <MenuItem
            key={response.id}
            onClick={handleOnClickFactory(response.text)}
          >
            <ListItemText primary={response.title} secondary={response.text} />
          </MenuItem>
        );
      })}
    </Menu>
  );
};

export default CannedResponseMenu;
