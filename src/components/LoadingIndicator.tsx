import { makeStyles } from "@material-ui/core";
import CircularProgress from "@material-ui/core/CircularProgress";
import React from "react";

const useStyles = makeStyles({
  loader: {
    marginRight: "auto",
    marginLeft: "auto",
    marginTop: 50,
    textAlign: "center"
  }
});

export const LoadingIndicator = () => {
  const styles = useStyles();
  return (
    <div className={styles.loader}>
      <CircularProgress />
    </div>
  );
};

export default LoadingIndicator;
