import omit from "lodash/omit";
import TextField from "material-ui/TextField";
import React from "react";

import GSFormField from "./GSFormField";

export default class GSTextField extends GSFormField {
  render() {
    const { value } = this.props;
    const safeProps = omit(this.props, "errors");
    return (
      <TextField
        ref="textField"
        floatingLabelText={this.floatingLabelText()}
        floatingLabelStyle={{
          zIndex: 0
        }}
        onFocus={(event) => event.target.select()}
        {...safeProps}
        value={value || ""}
        onChange={(event) => {
          this.props.onChange(event.target.value);
        }}
        type="text"
      />
    );
  }
}
