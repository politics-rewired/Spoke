import { gql } from "@apollo/client";
import Button from "@material-ui/core/Button";
import Dialog from "@material-ui/core/Dialog";
import DialogActions from "@material-ui/core/DialogActions";
import DialogContent from "@material-ui/core/DialogContent";
import Divider from "@material-ui/core/Divider";
import List from "@material-ui/core/List";
import ListItem from "@material-ui/core/ListItem";
import ListItemText from "@material-ui/core/ListItemText";
import ListSubheader from "@material-ui/core/ListSubheader";
import CreateIcon from "@material-ui/icons/Create";
import PropTypes from "prop-types";
import React from "react";

import CannedResponseForm from "./CannedResponseForm";
import GSSubmitButton from "./forms/GSSubmitButton";

const styles = {
  dialog: {
    zIndex: 10001
  }
};

class ScriptList extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      script: props.script,
      dialogOpen: false
    };
  }

  handleOpenDialog = () => {
    this.setState({
      dialogOpen: true
    });
  };

  handleCloseDialog = () => {
    this.setState({
      dialogOpen: false,
      script: null
    });
  };

  render() {
    const {
      subheader,
      scripts,
      onSelectCannedResponse,
      showAddScriptButton,
      customFields,
      campaignVariables,
      integrationSourced,
      campaignId,
      texterId
    } = this.props;
    const { dialogOpen } = this.state;

    const onSaveCannedResponse = async (cannedResponse) => {
      try {
        const saveObject = {
          ...cannedResponse,
          campaignId,
          userId: texterId
        };
        // Perform this mutation manually because we cannot use withOperations within
        // CannedResponseMenu's Popover (Popover exists outside of <ApolloProvider> context)
        await this.props.client.mutate({
          mutation: gql`
            mutation createCannedResponse(
              $cannedResponse: CannedResponseInput!
            ) {
              createCannedResponse(cannedResponse: $cannedResponse) {
                id
              }
            }
          `,
          variables: { cannedResponse: saveObject }
        });
        this.setState({ dialogOpen: false });
      } catch (err) {
        console.error(err);
      }
    };

    const listItems = scripts.map((script) => (
      <ListItem key={script.id} onClick={() => onSelectCannedResponse(script)}>
        <ListItemText
          primary={script.title}
          secondary={script.text}
          // secondaryTextLines={2}
        />
      </ListItem>
    ));

    const list =
      scripts.length === 0 ? null : (
        <List>
          <ListSubheader>{subheader}</ListSubheader>,{listItems}
          <Divider />
        </List>
      );

    return (
      <div>
        {list}
        {showAddScriptButton && (
          <Button endIcon={<CreateIcon />} onClick={this.handleOpenDialog}>
            Add new canned response
          </Button>
        )}
        <Dialog
          style={styles.dialog}
          open={dialogOpen}
          onClose={this.handleCloseDialog}
        >
          <DialogContent>
            <CannedResponseForm
              onSaveCannedResponse={onSaveCannedResponse}
              customFields={customFields}
              campaignVariables={campaignVariables}
              integrationSourced={integrationSourced}
              script={this.state.script}
            />
          </DialogContent>
          <DialogActions>
            <Button key="cancel" onClick={this.handleCloseDialog}>
              Cancel
            </Button>
            <GSSubmitButton key="save" label="Save" type="submit" />
          </DialogActions>
        </Dialog>
      </div>
    );
  }
}

ScriptList.propTypes = {
  client: PropTypes.object.isRequired,
  script: PropTypes.object,
  scripts: PropTypes.arrayOf(PropTypes.object),
  subheader: PropTypes.element,
  onSelectCannedResponse: PropTypes.func,
  showAddScriptButton: PropTypes.bool,
  customFields: PropTypes.array.isRequired,
  campaignVariables: PropTypes.arrayOf(
    PropTypes.shape({
      id: PropTypes.string.isRequired,
      name: PropTypes.string.isRequired,
      value: PropTypes.string
    })
  ).isRequired,
  integrationSourced: PropTypes.bool,
  campaignId: PropTypes.string,
  mutations: PropTypes.object,
  texterId: PropTypes.string
};

export default ScriptList;
