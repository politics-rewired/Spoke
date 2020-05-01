import React from "react";
import TextField from "material-ui/TextField";
import GSFormField from "./GSFormField";
import omit from "lodash/omit";

export default class GSTextField extends GSFormField {
  render() {
    let value = this.props.value;
    const safeProps = omit(this.props, "errors");
    return (
      <TextField
        ref="textField"
        floatingLabelText={this.floatingLabelText()}
        floatingLabelStyle={{
          zIndex: 0
        }}
        onFocus={event => event.target.select()}
        {...safeProps}
        value={value || ""}
        onChange={event => {
          this.props.onChange(event.target.value);
        }}
        type="text"
      />
    );
  }
}
