import { Card, CardContent, CardHeader } from "@material-ui/core";
import { css, StyleSheet } from "aphrodite";
import React from "react";

import LoadingIndicator from "../../components/LoadingIndicator";

const inlineStyles = StyleSheet.create({
  cardContent: {
    textAlign: "center",
    height: "50%",
    padding: "5px"
  },
  colorRed: { color: "red" }
});

export interface CampaignStatProps {
  title: string;
  loading?: boolean;
  error?: string;
  count?: any;
  highlight?: boolean;
}

export const CampaignStat: React.FC<CampaignStatProps> = (props) => {
  // shrink text if large number
  const heading =
    !Number.isNaN(props.count) && props.count >= 1e4 ? "h4" : "h3";
  const countStyle = props.highlight
    ? css(inlineStyles.cardContent, inlineStyles.colorRed)
    : css(inlineStyles.cardContent);

  return (
    <Card key={props.title} style={{ height: "100%" }}>
      {props.loading && <LoadingIndicator />}
      {props.error && (
        <CardContent className={css(inlineStyles.cardContent)}>
          {props.error}
        </CardContent>
      )}
      {props.count !== undefined && (
        <CardHeader
          title={props.count}
          titleTypographyProps={{ variant: heading }}
          className={countStyle}
        />
      )}
      <CardContent className={css(inlineStyles.cardContent)}>
        {props.title}
      </CardContent>
    </Card>
  );
};

export default CampaignStat;
