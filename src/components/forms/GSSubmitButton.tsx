import Button from "@material-ui/core/Button";
import CircularProgress from "material-ui/CircularProgress";
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
      <Button
        variant="contained"
        color="primary"
        type="submit"
        startIcon={icon}
        disabled={props.isSubmitting}
      >
        {props.label}
      </Button>
    </div>
  );
};

export default GSSubmitButton;
