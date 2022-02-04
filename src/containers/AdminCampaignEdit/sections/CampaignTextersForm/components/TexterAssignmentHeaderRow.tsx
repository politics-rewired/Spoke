import { css, StyleSheet } from "aphrodite";
import React from "react";

import rowStyles from "./rowStyles";

const headerStyles = StyleSheet.create({
  alreadyTextedHeader: {
    textAlign: "right",
    fontSize: 16
  },
  availableHeader: {
    fontSize: 16
  }
});

const TexterAssignmentHeaderRow: React.FC = () => (
  <div className={css(rowStyles.texterRow)}>
    <div
      className={css(rowStyles.leftSlider, headerStyles.alreadyTextedHeader)}
    >
      Already texted
    </div>
    <div className={css(rowStyles.assignedCount)} />
    <div className={css(rowStyles.nameColumn)} />
    <div className={css(rowStyles.input)} />
    <div className={css(rowStyles.slider, headerStyles.availableHeader)}>
      Available to assign
    </div>
    <div className={css(rowStyles.removeButton)} />
  </div>
);

export default TexterAssignmentHeaderRow;
