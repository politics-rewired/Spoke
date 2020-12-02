import CircularProgress from "material-ui/CircularProgress";
import RaisedButton from "material-ui/RaisedButton";
import PropTypes from "prop-types";
import React from "react";

const styles = {
  button: {
    display: "inline-block",
    marginTop: 15
  }
};

const GSSubmitButton = (props) => {
  let icon = "";
  const extraProps = {};
  if (props.isSubmitting) {
    extraProps.disabled = true;
    icon = (
      <CircularProgress
        size={0.5}
        style={{
          verticalAlign: "middle",
          display: "inline-block"
        }}
      />
    );
  }

  return (
    <div style={styles.button} {...props}>
      <RaisedButton
        primary
        type="submit"
        value="submit"
        {...props}
        {...extraProps}
      />
      {icon}
    </div>
  );
};

GSSubmitButton.propTypes = {
  isSubmitting: PropTypes.bool
};

export default GSSubmitButton;
