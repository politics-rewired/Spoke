import PropTypes from "prop-types";
import React from "react";

import DisplayLink from "./DisplayLink";

const OrganizationJoinLink = ({
  organizationUuid,
  campaignId,
  isSuperAdmin
}) => {
  let baseUrl = "http://base";
  if (typeof window !== "undefined") {
    baseUrl = window.location.origin;
  }

  const joinUrl = campaignId
    ? `${baseUrl}/${organizationUuid}/join/${campaignId}`
    : `${baseUrl}/${organizationUuid}/join`;

  const urlWithAdmin = isSuperAdmin ? `${joinUrl}/superadmin` : joinUrl;

  const textContent =
    "Send your texting volunteers this link! Once they sign up, they'll be automatically assigned to this campaign.";

  return <DisplayLink url={urlWithAdmin} textContent={textContent} />;
};

OrganizationJoinLink.propTypes = {
  organizationUuid: PropTypes.string,
  campaignId: PropTypes.string,
  isSuperAdmin: PropTypes.bool
};

export default OrganizationJoinLink;
