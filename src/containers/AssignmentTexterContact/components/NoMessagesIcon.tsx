import CreateIcon from "@material-ui/icons/Create";
import muiThemeable from "material-ui/styles/muiThemeable";
import React from "react";

import { useSpokeTheme } from "../../../styles/spoke-theme-context";
import type { MuiThemeProviderProps } from "../../../styles/types";

const NoMessagesIcon: React.FC<MuiThemeProviderProps> = ({
  muiTheme,
  ...iconProps
}) => {
  const spokeTheme = useSpokeTheme();

  if (spokeTheme?.firstMessageIconUrl) {
    return (
      <div {...iconProps}>
        <img
          src={spokeTheme?.firstMessageIconUrl}
          style={{ display: "block", margin: "auto", height: "100%" }}
        />
      </div>
    );
  }

  const iconColor = muiTheme?.palette?.primary1Color ?? "rgb(83, 180, 119)";
  return <CreateIcon style={{ color: iconColor }} {...iconProps} />;
};

export default muiThemeable()(NoMessagesIcon);
