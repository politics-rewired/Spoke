import { Card, CardText, CardTitle } from "material-ui/Card";
import PropTypes from "prop-types";
import React from "react";

import LoadingIndicator from "../../components/LoadingIndicator";

const inlineStyles = {
  stat: {
    margin: "10px 0",
    width: "100%",
    maxWidth: 400
  },
  count: {
    fontSize: "60px",
    paddingTop: "10px",
    textAlign: "center"
  },
  title: {
    textTransform: "uppercase",
    textAlign: "center",
    color: "gray"
  }
};

export const CampaignStat = ({ title, loading, error, count }) => (
  <Card key={title} style={inlineStyles.stat}>
    {loading && <LoadingIndicator />}
    {error && <CardText>{error}</CardText>}
    {count !== undefined && (
      <CardTitle title={count} titleStyle={inlineStyles.count} />
    )}
    <CardText style={inlineStyles.title}>{title}</CardText>
  </Card>
);

CampaignStat.defaultProps = {
  loading: false
};

CampaignStat.propTypes = {
  title: PropTypes.string.isRequired,
  loading: PropTypes.bool,
  error: PropTypes.string,
  count: PropTypes.any
};

export default CampaignStat;
