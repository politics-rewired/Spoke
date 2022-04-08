import ListItemText from "@material-ui/core/ListItemText";
import Menu from "@material-ui/core/Menu";
import MenuItem from "@material-ui/core/MenuItem";
import { useGetCampaignCannedResponsesQuery } from "@spoke/spoke-codegen";
import React from "react";

interface CannedResponseMenuProps {
  anchorEl?: Element;
  campaignId?: string;
  onSelectCannedResponse?: (script: string) => Promise<void> | void;
  onRequestClose?: () => Promise<void> | void;
}

const CannedResponseMenu: React.FC<CannedResponseMenuProps> = (props) => {
  const { campaignId, anchorEl } = props;
  const { data, loading, error } = useGetCampaignCannedResponsesQuery({
    variables: { campaignId: campaignId! },
    skip: campaignId === undefined
  });

  const handleOnClickFactory = (script: string) => () =>
    props.onSelectCannedResponse?.(script);

  const cannedResponses = data?.campaign?.cannedResponses ?? [];

  return (
    <Menu
      anchorEl={anchorEl}
      keepMounted
      open={Boolean(anchorEl)}
      onClose={props?.onRequestClose}
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
