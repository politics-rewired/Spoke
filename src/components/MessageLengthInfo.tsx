import { getCharCount } from "@trt2/gsm-charset-utils";
import PropTypes from "prop-types";
import React from "react";

import { replaceEasyGsmWins } from "../lib/charset-utils";

const MessageLengthInfo: React.SFC<{ messageText: string }> = ({
  messageText
}) => {
  const { charCount, msgCount, charsPerSegment } = getCharCount(
    replaceEasyGsmWins(messageText)
  );
  const segmentInfo = msgCount === 1 ? "(1 segment)" : `(${msgCount} segments)`;

  return (
    <div style={{ display: "inline" }}>
      {`${charCount}/${msgCount * charsPerSegment} ${segmentInfo}`}
    </div>
  );
};

MessageLengthInfo.propTypes = {
  messageText: PropTypes.string.isRequired
};

export default MessageLengthInfo;
