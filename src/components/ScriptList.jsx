import gql from "graphql-tag";
import Dialog from "material-ui/Dialog";
import Divider from "material-ui/Divider";
import FlatButton from "material-ui/FlatButton";
import { List, ListItem } from "material-ui/List";
import Subheader from "material-ui/Subheader";
import CreateIcon from "material-ui/svg-icons/content/create";
import PropTypes from "prop-types";
import React from "react";
import Form from "react-formal";

import { withOperations } from "../containers/hoc/with-operations";
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
      campaignId,
      mutations,
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
        await mutations.createCannedResponse(saveObject);
        this.setState({ dialogOpen: false });
      } catch (err) {
        console.error(err);
      }
    };

    const rightIconButton = null;
    const listItems = scripts.map((script) => (
      <ListItem
        value={script.text}
        onClick={() => onSelectCannedResponse(script)}
        key={script.id}
        primaryText={script.title}
        secondaryText={script.text}
        rightIconButton={rightIconButton}
        secondaryTextLines={2}
      />
    ));

    const list =
      scripts.length === 0 ? null : (
        <List>
          <Subheader>{subheader}</Subheader>,{listItems}
          <Divider />
        </List>
      );

    return (
      <div>
        {list}
        {showAddScriptButton && (
          <FlatButton
            label="Add new canned response"
            icon={<CreateIcon />}
            onClick={this.handleOpenDialog}
          />
        )}
        <Form.Context>
          <Dialog
            style={styles.dialog}
            open={dialogOpen}
            actions={[
              <FlatButton
                key="cancel"
                label="Cancel"
                onClick={this.handleCloseDialog}
              />,
              <Form.Button
                key="save"
                label="Save"
                component={GSSubmitButton}
                type="submit"
              />
            ]}
            onRequestClose={this.handleCloseDialog}
          >
            <CannedResponseForm
              onSaveCannedResponse={onSaveCannedResponse}
              customFields={customFields}
              script={this.state.script}
            />
          </Dialog>
        </Form.Context>
      </div>
    );
  }
}

ScriptList.propTypes = {
  script: PropTypes.object,
  scripts: PropTypes.arrayOf(PropTypes.object),
  subheader: PropTypes.element,
  onSelectCannedResponse: PropTypes.func,
  showAddScriptButton: PropTypes.bool,
  customFields: PropTypes.array,
  campaignId: PropTypes.string,
  mutations: PropTypes.object,
  texterId: PropTypes.string
};

const mutations = {
  createCannedResponse: () => (cannedResponse) => ({
    mutation: gql`
      mutation createCannedResponse($cannedResponse: CannedResponseInput!) {
        createCannedResponse(cannedResponse: $cannedResponse) {
          id
        }
      }
    `,
    variables: { cannedResponse }
  })
};

export default withOperations({
  mutations
})(ScriptList);
