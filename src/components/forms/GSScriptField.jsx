import pick from "lodash/pick";
import Dialog from "material-ui/Dialog";
import FlatButton from "material-ui/FlatButton";
import RaisedButton from "material-ui/RaisedButton";
import TextField from "material-ui/TextField";
import PropTypes from "prop-types";
import React from "react";

import { dataTest } from "../../lib/attributes";
import { allScriptFields } from "../../lib/scripts";
import ScriptEditor from "../ScriptEditor";
import GSFormField from "./GSFormField";

const styles = {
  dialog: {
    zIndex: 10001
  }
};

class GSScriptField extends GSFormField {
  constructor(props) {
    super(props);
    this.state = {
      open: false,
      script: props.value
    };
  }

  handleOpenDialog = (event) => {
    event.stopPropagation();
    event.preventDefault();
    this.setState(
      {
        open: true
      },
      () => this.refs.dialogScriptInput.focus()
    );
  };

  handleCancelDialog = () => {
    // Reset any changes the user has made in the Editor
    const script = this.props.value;
    this.setState({
      open: false,
      script
    });
  };

  handleSaveScript = () => {
    const value = this.state.script;
    this.props.onChange(value);
    this.setState({ open: false });
  };

  renderDialog() {
    const { name, customFields } = this.props;
    const { open } = this.state;
    const scriptFields = allScriptFields(customFields);
    return (
      <Dialog
        style={styles.dialog}
        actions={[
          <FlatButton
            key="cancel"
            {...dataTest("scriptCancel")}
            label="Cancel"
            onTouchTap={this.handleCancelDialog}
          />,
          <RaisedButton
            key="done"
            {...dataTest("scriptDone")}
            label="Done"
            onTouchTap={this.handleSaveScript}
            primary
          />
        ]}
        modal
        open={open}
        onRequestClose={this.handleCancelDialog}
      >
        <ScriptEditor
          ref="dialogScriptInput"
          name={name}
          scriptText={this.state.script}
          scriptFields={scriptFields}
          expandable
          onChange={(val) => this.setState({ script: val })}
        />
      </Dialog>
    );
  }

  render() {
    // The "errors" prop is an empty object and is not mentioned in yum or react-formal documentation
    const passThroughProps = pick(this.props, [
      "className",
      "fullWidth",
      "hintText",
      "label",
      "multiLine",
      "name",
      "value",
      "data-test",
      "onBlur",
      "onChange"
    ]);
    return (
      <div>
        <TextField
          multiLine
          onClick={this.handleOpenDialog}
          floatingLabelText={this.floatingLabelText()}
          floatingLabelStyle={{
            zIndex: 0
          }}
          {...passThroughProps}
        />
        {this.renderDialog()}
      </div>
    );
  }
}

GSScriptField.propTypes = {
  value: PropTypes.string.isRequired,
  customFields: PropTypes.arrayOf(PropTypes.string).isRequired,
  name: PropTypes.string,
  className: PropTypes.string,
  hintText: PropTypes.string,
  label: PropTypes.string,
  multiLine: PropTypes.bool,
  fullWidth: PropTypes.bool,
  onChange: PropTypes.func.isRequired,
  onBlur: PropTypes.func
};

export default GSScriptField;
