import React from "react";
import ReactDOMServer from "react-dom/server";

import type { ExportURLs } from "./export-campaign";

export type CampaignExportDetails = {
  campaignTitle: string;
  exportUrls: ExportURLs | null;
};

export type CampaignExportMetaData = {
  [id: string]: CampaignExportDetails;
};

interface Props {
  campaignExportMetaData: CampaignExportMetaData;
}

const ExportMultipleCampaigns: React.FC<Props> = ({
  campaignExportMetaData
}) => {
  const campaignIds = Object.keys(campaignExportMetaData);
  return (
    <div>
      <p>
        Your spoke exports are ready! These URLs will be valid for 24 hours.
      </p>
      {campaignIds.map((campaignId) => {
        const { exportUrls, campaignTitle } = campaignExportMetaData[
          campaignId
        ];
        // this is checked before rendering the component, but satisfying typescript here
        if (!exportUrls) {
          throw new Error(
            "attempted to render email component without export urls"
          );
        }
        const {
          campaignExportUrl,
          campaignMessagesExportUrl,
          campaignOptOutsExportUrl,
          campaignFilteredContactsExportUrl
        } = exportUrls;
        return (
          <>
            <p>
              {campaignTitle} - ID: {campaignId}
            </p>
            {campaignExportUrl && <p>Campaign Export: {campaignExportUrl}</p>}
            {campaignMessagesExportUrl && (
              <p>Campaign Messages Export: {campaignMessagesExportUrl}</p>
            )}
            {campaignOptOutsExportUrl && (
              <p>Campaign OptOuts Export: {campaignOptOutsExportUrl}</p>
            )}
            {campaignFilteredContactsExportUrl && (
              <p>
                Campaign Filtered Contacts Export:{" "}
                {campaignFilteredContactsExportUrl}
              </p>
            )}
          </>
        );
      })}
      <br />
      -- The Spoke Rewired Team
    </div>
  );
};

const getEmailContent = (campaignExportMetaData: CampaignExportMetaData) => {
  const template = (
    <ExportMultipleCampaigns campaignExportMetaData={campaignExportMetaData} />
  );

  return ReactDOMServer.renderToStaticMarkup(template);
};

export default getEmailContent;
