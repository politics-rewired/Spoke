import { useTheme } from "@material-ui/core";
import RaisedButton from "material-ui/RaisedButton";
import React, { useContext, useState } from "react";

import SpokeContext from "../client/spoke-context";
import { dataTest } from "../lib/attributes";

interface Props {
  threeClickEnabled?: boolean;
  disabled?: boolean;
  style?: React.CSSProperties;
  onFinalTouchTap: () => void | Promise<void>;
}

const SendButton: React.FC<Props> = (props) => {
  const theme = useTheme();
  const context = useContext(SpokeContext);
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
    <RaisedButton
      {...dataTest("send")}
      style={props.style}
      onClick={handleTouchTap}
      disabled={props.disabled}
      label={clickStepLabels[clickStepIndex]}
      primary={context.theme?.successColor === undefined}
      backgroundColor={theme.palette.success.main}
    />
  );
};

export default SendButton;
