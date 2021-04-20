import CircularProgress from "material-ui/CircularProgress";
import RaisedButton from "material-ui/RaisedButton";
import React from "react";

const styles = {
  button: {
    display: "inline-block",
    marginTop: 15
  },
  progress: {
    verticalAlign: "middle",
    display: "inline-block"
  }
};

interface Props {
  isSubmitting: boolean;
  [key: string]: any;
}

const GSSubmitButton: React.FC<Props> = (props) => {
  const icon = props.isSubmitting ? (
    <CircularProgress size={0.5} style={styles.progress} />
  ) : null;
  return (
    <div style={styles.button} {...props}>
      <RaisedButton
        primary
        type="submit"
        label={props.label}
        labelPosition="after"
        icon={icon}
        disabled={props.isSubmitting}
      />
    </div>
  );
};

export default GSSubmitButton;
