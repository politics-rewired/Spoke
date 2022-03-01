import { useTheme } from "@material-ui/core";
import { css, StyleSheet } from "aphrodite";
import RaisedButton from "material-ui/RaisedButton";
import React, { useState } from "react";

import { dataTest } from "../lib/attributes";
import { useSpokeTheme } from "../styles/spoke-theme-context";

// This is because the Toolbar from material-ui seems to only apply the correct margins if the
// immediate child is a Button or other type it recognizes. Can get rid of this if we remove material-ui
const styles = StyleSheet.create({
  container: {
    display: "inline-block",
    marginLeft: 24,
    marginBottom: 10
  }
});

interface Props {
  threeClickEnabled?: boolean;
  disabled?: boolean;
  onFinalTouchTap: () => void | Promise<void>;
}

const SendButton: React.FC<Props> = (props) => {
  const theme = useTheme();
  const spokeTheme = useSpokeTheme();
  const [clickStepIndex, setClickStepIndex] = useState(0);

  const clickStepLabels = props.threeClickEnabled
    ? ["Recipient ok?", "Message ok?", "Send message"]
    : ["Send"];

  const handleTouchTap = () => {
    const { onFinalTouchTap } = props;

    if (clickStepIndex < clickStepLabels.length - 1) {
      setClickStepIndex(clickStepIndex + 1);
    } else {
      onFinalTouchTap();
    }
  };

  return (
    <div className={css(styles.container)}>
      <RaisedButton
        {...dataTest("send")}
        onClick={handleTouchTap}
        disabled={props.disabled}
        label={clickStepLabels[clickStepIndex]}
        primary={spokeTheme?.successColor === undefined}
        backgroundColor={theme.palette.success.main}
      />
    </div>
  );
};

export default SendButton;
