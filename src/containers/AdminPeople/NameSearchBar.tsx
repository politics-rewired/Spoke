/* eslint-disable no-unused-vars */
import { TextField } from "material-ui";
import React from "react";

export class NameSearchBar extends React.Component<
  {
    onSubmit: (currentText: string) => void;
    onChange: (newText: string) => void;
  },
  { currentText: string }
> {
  state = {
    currentText: ""
  };

  render() {
    return (
      <form
        onSubmit={(ev) => {
          ev.preventDefault();
          this.props.onSubmit(this.state.currentText);
        }}
      >
        <TextField
          id="outlined-basic"
          onChange={(_, newText) => {
            this.setState({ currentText: newText });
            this.props.onChange(newText);
          }}
        />
      </form>
    );
  }
}
export default NameSearchBar;
