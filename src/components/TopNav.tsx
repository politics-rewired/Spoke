import { useTheme } from "@material-ui/core";
import { common } from "@material-ui/core/colors";
import IconButton from "@material-ui/core/IconButton";
import ArrowBackIcon from "@material-ui/icons/ArrowBack";
import { css, StyleSheet } from "aphrodite";
import React from "react";
import { Helmet } from "react-helmet";
import { Link } from "react-router-dom";

import UserMenu from "../containers/UserMenu";
import baseTheme from "../styles/theme";

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

interface TopNavProps {
  backToURL?: string;
  title: string;
  orgId?: string;
  sectionTitle: string;
}

const TopNav: React.FC<TopNavProps> = ({
  backToURL,
  orgId,
  title,
  sectionTitle
}) => {
  const theme = useTheme();

  const overrides = {
    container: {
      backgroundColor: theme.palette.primary.main
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

export default TopNav;
