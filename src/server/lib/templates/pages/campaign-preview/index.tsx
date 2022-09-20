import sortBy from "lodash/sortBy";
import React from "react";
import ReactDOMServer from "react-dom/server";

import { getTopMostParent } from "../../../../../lib/interaction-step-helpers";
import type {
  CampaignRecord,
  CannedResponseRecord,
  InteractionStepRecord
} from "../../../../api/types";

const stepDomId = (stepId: number) => `istep-${stepId}`;

const getInteractionStepsWithParentId = (
  parentId: number,
  interactionSteps: InteractionStepRecord[]
) =>
  sortBy(
    interactionSteps.filter((is) => is.parent_interaction_id === parentId),
    (i) => i.answer_option
  );

const COLORS = ["#1b9e77", "#d95f02", "#7570b3"];

export interface RenderCampaignPreviewOptions {
  campaign: CampaignRecord;
  interactionSteps: InteractionStepRecord[];
  cannedResponses: CannedResponseRecord[];
}

const PreviewTOC: React.FC<Pick<
  RenderCampaignPreviewOptions,
  "interactionSteps"
>> = ({ interactionSteps }) => {
  const rootInteractionStep = getTopMostParent(interactionSteps, true);

  if (interactionSteps.length === 0 || !rootInteractionStep) return null;

  const topLevelSteps: InteractionStepRecord[] = getInteractionStepsWithParentId(
    rootInteractionStep.id,
    interactionSteps
  );

  return (
    <ol>
      {topLevelSteps.map((step) => (
        <li key={stepDomId(step.id)}>
          <a href={`#${stepDomId(step.id)}`}>{step.answer_option}</a>
        </li>
      ))}
    </ol>
  );
};

type InteractionStepProps = Pick<
  RenderCampaignPreviewOptions,
  "interactionSteps"
> & { rootStep: InteractionStepRecord; depth?: number };

const InteractionStep: React.FC<InteractionStepProps> = ({
  interactionSteps,
  rootStep,
  depth = 0
}) => {
  const childSteps: InteractionStepRecord[] = getInteractionStepsWithParentId(
    rootStep.id,
    interactionSteps
  );

  const className =
    childSteps.length === 0
      ? "interaction-step no-children"
      : "interaction-step with-children";

  const color = COLORS[depth % COLORS.length];
  const style = {
    borderLeft: `5px solid ${color}`,
    paddingLeft: "10px"
  };

  return (
    <li id={stepDomId(rootStep.id)} className={className} style={style}>
      {rootStep.answer_option && (
        <p className="answer-option">
          <strong>{rootStep.answer_option}</strong>
        </p>
      )}
      {rootStep.script_options.map((scriptOption) => (
        <p key={scriptOption} className="script">
          <em>{scriptOption}</em>
        </p>
      ))}
      {rootStep.question && (
        <p className="question">
          <strong>Question: {rootStep.question}</strong>
        </p>
      )}
      {childSteps && (
        <>
          <i className="bi bi-chevron-down" />
          <i className="bi bi-chevron-up" />
          <ul>
            {childSteps.map((childStep) => (
              <InteractionStep
                key={childStep.id}
                rootStep={childStep}
                interactionSteps={interactionSteps}
                depth={depth + 1}
              />
            ))}
          </ul>
        </>
      )}
    </li>
  );
};

const InteractionStepPreview: React.FC<Pick<
  RenderCampaignPreviewOptions,
  "interactionSteps"
>> = ({ interactionSteps }) => {
  const rootStep: InteractionStepRecord = getTopMostParent(
    interactionSteps,
    true
  );

  if (interactionSteps.length === 0 || !rootStep) {
    return <span>N/A</span>;
  }

  return (
    <ul>
      <InteractionStep
        rootStep={rootStep}
        interactionSteps={interactionSteps}
        depth={0}
      />
    </ul>
  );
};

const CannedResponsePreview: React.FC<Pick<
  RenderCampaignPreviewOptions,
  "cannedResponses"
>> = ({ cannedResponses }) => {
  if (cannedResponses.length === 0) {
    return <span>N/A</span>;
  }

  return (
    <ul>
      {cannedResponses.map((cannedResponse) => (
        <li key={cannedResponse.id} className="canned-response">
          <p className="title">
            <strong>{cannedResponse.title}</strong>
          </p>
          <p className="text">
            <em>{cannedResponse.text}</em>
          </p>
        </li>
      ))}
    </ul>
  );
};

const PreviewContent: React.FC<RenderCampaignPreviewOptions> = (props) => {
  const { campaign, interactionSteps, cannedResponses } = props;

  return (
    <div>
      <h1>Preview for campaign {campaign.id}</h1>
      <h2>{campaign.title}</h2>
      <PreviewTOC interactionSteps={interactionSteps} />
      <h2 id="script">Script</h2>
      <InteractionStepPreview interactionSteps={interactionSteps} />
      <h2 id="canned-responses">Canned Responses</h2>
      <CannedResponsePreview cannedResponses={cannedResponses} />
    </div>
  );
};

export const renderCampaignPreview = (
  options: RenderCampaignPreviewOptions
) => {
  const pageTitle = `Preview for Campaign ${options.campaign.id}`;
  const campaignPreviewHtml = ReactDOMServer.renderToStaticMarkup(
    <PreviewContent {...options} />
  );

  const page = `
    <html>
      <head>
        <title>${pageTitle}</title>
        <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/bootstrap-icons@1.8.0/font/bootstrap-icons.css" integrity="sha384-ejwKkLla8gPP8t2u0eQyL0Q/4ItcnyveF505U0NIobD/SMsNyXrLti6CWaD0L52l" crossorigin="anonymous">
        <script src="https://code.jquery.com/jquery-3.6.0.min.js"></script>
        <style>
          li.collapsed ul {
            display: none;
          }
          li.interaction-step > i.bi-chevron-down {
            display: none;
          }
          li.collapsed > i.bi-chevron-up {
            display: none;
          }
          li.collapsed > i.bi-chevron-down {
            display: inline !important;
          }
          .no-children i.bi {
            display: none !important;
          }
          .script {
            white-space: pre-wrap;
          }
          html{background-color:#fefefe}body{font-family:Open Sans,Arial;color:#454545;font-size:16px;margin:2em auto;max-width:800px;padding:1em;line-height:1.4;text-align:justify}html.contrast body{color:#050505}html.contrast blockquote{color:#11151a}html.contrast blockquote:before{color:#262626}html.contrast a{color:#0051c9}html.contrast a:visited{color:#7d013e}html.contrast span.wr{color:#800}html.contrast span.mfw{color:#4d0000}html.inverted{background-color:#010101}html.inverted body{color:#bababa}html.inverted div#contrast,html.inverted div#invmode{color:#fff;background-color:#000}html.inverted blockquote{color:#dad0c7}html.inverted blockquote:before{color:#bfbfbf}html.inverted a{color:#07a}html.inverted a:visited{color:#ac5a82}html.inverted span.wr{color:#c0392b}html.inverted span.mfw{color:#8a0000}html.inverted.contrast{background-color:#010101}html.inverted.contrast body{color:#fff}html.inverted.contrast div#contrast,html.inverted.contrast div#invmode{color:#fff;background-color:#000}html.inverted.contrast blockquote{color:#f8f6f5}html.inverted.contrast blockquote:before{color:#e5e5e5}html.inverted.contrast a{color:#07a}html.inverted.contrast a:visited{color:#ac5a82}html.inverted.contrast span.wr{color:#c0392b}html.inverted.contrast span.mfw{color:#a10000}a{color:#07a}a:visited{color:#941352}.noselect{-webkit-touch-callout:none;-webkit-user-select:none;-khtml-user-select:none;-moz-user-select:none;-ms-user-select:none;user-select:none}span.citneed{vertical-align:top;font-size:.7em;padding-left:.3em}small{font-size:.4em}p.st{margin-top:-1em}div.fancyPositioning div.picture-left{float:left;width:40%;overflow:hidden;margin-right:1em}div.fancyPositioning div.picture-left img{width:100%}div.fancyPositioning div.picture-left p.caption{font-size:.7em}div.fancyPositioning div.tleft{float:left;width:55%}div.fancyPositioning div.tleft p:first-child{margin-top:0}div.fancyPositioning:after{display:block;content:"";clear:both}ul li img{height:1em}blockquote{color:#456;margin-left:0;margin-top:2em;margin-bottom:2em}blockquote span{float:left;margin-left:1rem;padding-top:1rem}blockquote author{display:block;clear:both;font-size:.6em;margin-left:2.4rem;font-style:oblique}blockquote author:before{content:"- ";margin-right:1em}blockquote:before{font-family:Times New Roman,Times,Arial;color:#666;content:open-quote;font-size:2.2em;font-weight:600;float:left;margin-top:0;margin-right:.2rem;width:1.2rem}blockquote:after{content:"";display:block;clear:both}@media screen and (max-width:500px){body{text-align:left}div.fancyPositioning div.picture-left,div.fancyPositioning div.tleft{float:none;width:inherit}blockquote span{width:80%}blockquote author{padding-top:1em;width:80%;margin-left:15%}blockquote author:before{content:"";margin-right:inherit}}span.visited{color:#941352}span.visited-maroon{color:#85144b}span.wr{color:#c0392b;font-weight:600;text-decoration:underline}div#contrast{color:#000;top:10px}div#contrast,div#invmode{cursor:pointer;position:absolute;right:10px;font-size:.8em;text-decoration:underline;-webkit-touch-callout:none;-webkit-user-select:none;-khtml-user-select:none;-moz-user-select:none;-ms-user-select:none;user-select:none}div#invmode{color:#fff;background-color:#000;top:34px;padding:2px 5px}span.sb{color:#00e}span.sb,span.sv{cursor:not-allowed}span.sv{color:#551a8b}span.foufoufou{color:#444;font-weight:700}span.foufoufou:before{content:"";display:inline-block;width:1em;height:1em;margin-left:.2em;margin-right:.2em;background-color:#444}span.foufivfoufivfoufiv{color:#454545;font-weight:700}span.foufivfoufivfoufiv:before{content:"";display:inline-block;width:1em;height:1em;margin-left:.2em;margin-right:.2em;background-color:#454545}span.mfw{color:#730000}a.kopimi,a.kopimi img.kopimi{display:block;margin-left:auto;margin-right:auto}a.kopimi img.kopimi{height:2em}p.fakepre{font-family:monospace;font-size:.9em}
        </style>
      </head>
      <body>
        ${campaignPreviewHtml}
      <script>
        $(".interaction-step.with-children").on('click', function(event){
          event.stopPropagation();
          event.stopImmediatePropagation();
          $(this).toggleClass("collapsed");
        });
      </script>
      </body>
    </html>
  `;

  return page;
};

export default renderCampaignPreview;
