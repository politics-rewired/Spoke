import { common } from "@material-ui/core/colors";
import IconButton from "@material-ui/core/IconButton";
import ArrowBackIcon from "@material-ui/icons/ArrowBack";
import { css, StyleSheet } from "aphrodite";
import muiThemeable from "material-ui/styles/muiThemeable";
import React from "react";
import { Helmet } from "react-helmet";
import { Link } from "react-router-dom";
import { compose } from "recompose";

import { Organization } from "../api/organization";
import UserMenu from "../containers/UserMenu";
import baseTheme from "../styles/theme";
import { MuiThemeProviderProps } from "../styles/types";

const styles = StyleSheet.create({
  container: {
    ...baseTheme.layouts.multiColumn.container,
    color: common.white,
    height: 65,
    verticalAlign: "middle",
    paddingLeft: 15,
    paddingRight: 15
  },
  inline: {
    display: "inline-block",
    marginLeft: 5,
    marginTop: "auto",
    marginBottom: "auto"
  },
  userMenu: {
    marginTop: "auto",
    marginBottom: "auto"
  },
  header: {
    ...baseTheme.text.header,
    fontSize: 24,
    color: common.white
  },
  flexColumn: {
    flex: 1,
    textAlign: "left",
    display: "flex"
  }
});

interface OuterProps {
  backToURL?: string;
  title: string;
  orgId?: string;
  sectionTitle: string;
}

interface InnerProps extends OuterProps, MuiThemeProviderProps {
  data: { organization?: Pick<Organization, "id" | "name"> };
}

const TopNav: React.FC<InnerProps> = ({
  backToURL,
  orgId,
  title,
  sectionTitle,
  muiTheme
}) => {
  const overrides = {
    container: {
      backgroundColor:
        muiTheme?.palette?.primary1Color ?? baseTheme.colors.green
    }
  };

  const pageTitle = `${sectionTitle} - ${title}`;

  return (
    <div className={css(styles.container)} style={overrides.container}>
      <Helmet>
        <title>{pageTitle}</title>
      </Helmet>
      <div className={css(styles.flexColumn)}>
        <div className={css(styles.inline)}>
          {backToURL && (
            <Link to={backToURL}>
              <IconButton>
                <ArrowBackIcon style={{ color: common.white }} />
              </IconButton>
            </Link>
          )}
        </div>
        <div className={css(styles.inline, styles.header)}>{pageTitle}</div>
      </div>
      <div className={css(styles.userMenu)}>
        <UserMenu orgId={orgId} />
      </div>
    </div>
  );
};

export default compose<InnerProps, OuterProps>(muiThemeable())(TopNav);
