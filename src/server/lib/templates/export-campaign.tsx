import React from "react";
import ReactDOMServer from "react-dom/server";

export type ExportURLs = {
  campaignExportUrl?: string | undefined;
  campaignMessagesExportUrl?: string | undefined;
  campaignOptOutsExportUrl?: string | undefined;
  campaignFilteredContactsExportUrl?: string | undefined;
};
interface ExportProps {
  exportUrls: ExportURLs;
  campaignTitle: string;
}

export const ExportCampaign: React.FC<ExportProps> = ({
  exportUrls,
  campaignTitle
}) => {
  const {
    campaignExportUrl,
    campaignFilteredContactsExportUrl,
    campaignMessagesExportUrl,
    campaignOptOutsExportUrl
  } = exportUrls;

  return (
    <div>
      <p>
        Your spoke exports for {campaignTitle} are ready! These URLs will be
        valid for 24 hours.
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
          Campaign Filtered Contacts Export: {campaignFilteredContactsExportUrl}
        </p>
      )}
      <br />
      -- The Spoke Rewired Team
    </div>
  );
};

export const getContent = async (
  exportUrls: ExportURLs,
  campaignTitle: string
) => {
  const template = (
    <ExportCampaign campaignTitle={campaignTitle} exportUrls={exportUrls} />
  );

  return ReactDOMServer.renderToStaticMarkup(template);
};
