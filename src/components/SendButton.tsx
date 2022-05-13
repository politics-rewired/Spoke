import { useTheme } from "@material-ui/core";
import Button from "@material-ui/core/Button";
import React, { useState } from "react";

import { dataTest } from "../lib/attributes";
import { useSpokeTheme } from "../styles/spoke-theme-context";

interface Props {
  threeClickEnabled?: boolean;
  disabled?: boolean;
  style?: React.CSSProperties;
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
    <Button
      {...dataTest("send")}
      variant="contained"
      style={{ backgroundColor: theme.palette.success.main, ...props.style }}
      onClick={handleTouchTap}
      disabled={props.disabled}
      color={spokeTheme?.successColor === undefined ? "primary" : "default"}
    >
      {clickStepLabels[clickStepIndex]}
    </Button>
  );
};

export default SendButton;
