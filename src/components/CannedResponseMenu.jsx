import { List } from "material-ui/List";
import Popover from "material-ui/Popover";
import type from "prop-types";
import React from "react";

import ScriptList from "./ScriptList";

const styles = {
  popover: {
    width: "75%",
    overflowY: "scroll"
  }
};

class CannedResponseMenu extends React.Component {
  handleSelectCannedResponse = (cannedResponse) => {
    const { onSelectCannedResponse, onRequestClose } = this.props;
    onSelectCannedResponse(cannedResponse.text);
    onRequestClose();
  };

  renderCannedResponses({ scripts, subheader, showAddScriptButton }) {
    const { customFields, campaignId, texterId } = this.props;

    return (
      <ScriptList
        texterId={texterId}
        campaignId={campaignId}
        scripts={scripts}
        showAddScriptButton={showAddScriptButton}
        duplicateCampaignResponses
        customFields={customFields}
        subheader={subheader}
        onSelectCannedResponse={this.handleSelectCannedResponse}
      />
    );
  }

  render() {
    const {
      campaignCannedResponses,
      open,
      onRequestClose,
      anchorEl
    } = this.props;

    return (
      <div>
        <Popover
          open={open}
          anchorEl={anchorEl}
          anchorOrigin={{ horizontal: "left", vertical: "bottom" }}
          targetOrigin={{ horizontal: "left", vertical: "bottom" }}
          onRequestClose={onRequestClose}
          style={{
            ...styles.popover,
            overflowY: "scroll",
            width: "75%"
          }}
        >
          <List>
            {this.renderCannedResponses({
              scripts: campaignCannedResponses,
              subheader: "Suggested",
              showAddScriptButton: false
            })}
          </List>
        </Popover>
      </div>
    );
  }
}

CannedResponseMenu.propTypes = {
  scripts: type.array,
  onSelectCannedResponse: type.func,
  onRequestClose: type.func,
  customFields: type.array,
  texterId: type.string,
  userCannedResponses: type.array,
  open: type.bool,
  anchorEl: type.object,
  campaignId: type.string,
  campaignCannedResponses: type.array
};

export default CannedResponseMenu;
