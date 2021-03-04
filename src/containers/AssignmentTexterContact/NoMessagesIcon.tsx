import muiThemeable from "material-ui/styles/muiThemeable";
import CreateIcon from "material-ui/svg-icons/content/create";
import React, { useContext } from "react";

import SpokeContext from "../../client/spoke-context";
import { MuiThemeProviderProps } from "../../styles/types";

const NoMessagesIcon: React.FC<MuiThemeProviderProps> = ({
  muiTheme,
  ...iconProps
}) => {
  const context = useContext(SpokeContext);

  if (context.theme?.firstMessageIconUrl) {
    return (
      <div {...iconProps}>
        <img
          src={context.theme?.firstMessageIconUrl}
          style={{ display: "block", margin: "auto", height: "100%" }}
        />
      </div>
    );
  }

  const iconColor = muiTheme?.palette?.primary1Color ?? "rgb(83, 180, 119)";
  return <CreateIcon color={iconColor} {...iconProps} />;
};

export default muiThemeable()(NoMessagesIcon);
