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
          underlineShow
          onChange={(_, newText) => {
            this.setState({ currentText: newText });
            this.props.onChange(newText);
          }}
          hintStyle={{ left: 18 }}
          hintText="Search"
        />
      </form>
    );
  }
}
export default NameSearchBar;
