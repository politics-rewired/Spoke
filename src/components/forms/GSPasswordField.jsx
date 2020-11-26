import TextField from "material-ui/TextField";
import React from "react";

import GSFormField from "./GSFormField";

export default class GSPasswordField extends GSFormField {
  render() {
    const { value } = this.props;
    return (
      <TextField
        floatingLabelText={this.floatingLabelText()}
        floatingLabelStyle={{
          zIndex: 0
        }}
        onFocus={(event) => event.target.select()}
        {...this.props}
        value={value}
        onChange={(event) => {
          this.props.onChange(event.target.value);
        }}
        type="password"
      />
    );
  }
}
