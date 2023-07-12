import GraphQLDate from "graphql-date";
import GraphQLJSON from "graphql-type-json";
import { GraphQLUpload } from "graphql-upload";

import { resolvers as assignmentResolvers } from "./assignment";
import { resolvers as assignmentRequestResolvers } from "./assignment-request";
import { resolvers as campaignResolvers } from "./campaign";
import { resolvers as campaignContactResolvers } from "./campaign-contact";
import { resolvers as campaignContactTagResolvers } from "./campaign-contact-tag";
import { resolvers as campaignGroupResolvers } from "./campaign-group";
import { resolvers as campaignVariableResolvers } from "./campaign-variable";
import { resolvers as cannedResponseResolvers } from "./canned-response";
import { resolvers as conversationsResolver } from "./conversations";
import { resolvers as externalActivistCodeResolvers } from "./external-activist-code";
import { resolvers as externalListResolvers } from "./external-list";
import { resolvers as externalResultCodeResolvers } from "./external-result-code";
import { resolvers as externalSurveyQuestionResolvers } from "./external-survey-question";
import { resolvers as externalResponseOptionResolvers } from "./external-survey-question-response-option";
import { resolvers as externalSyncConfigResolvers } from "./external-sync-config";
import { resolvers as externalSystemResolvers } from "./external-system";
import { resolvers as interactionStepResolvers } from "./interaction-step";
import { resolvers as inviteResolvers } from "./invite";
import { resolvers as linkDomainResolvers } from "./link-domain";
import { resolvers as messageResolvers } from "./message";
import { resolvers as messagingServiceResolvers } from "./messaging-service";
import { resolvers as noticeResolvers } from "./notice";
import { resolvers as optOutResolvers } from "./opt-out";
import { resolvers as organizationResolvers } from "./organization";
import { resolvers as membershipSchema } from "./organization-membership";
import { resolvers as settingsSchema } from "./organization-settings";
import { GraphQLPhone } from "./phone";
import { resolvers as questionResolvers } from "./question";
import { resolvers as questionResponseResolvers } from "./question-response";
import rootMutations from "./root-mutations";
import rootResolvers from "./root-resolvers";
import { resolvers as tagResolvers } from "./tag";
import { resolvers as teamResolvers } from "./team";
import { resolvers as trollbotResolvers } from "./trollbot";
import { resolvers as userResolvers } from "./user";

export const resolvers = {
  ...tagResolvers,
  ...teamResolvers,
  ...assignmentRequestResolvers,
  ...rootResolvers,
  ...userResolvers,
  ...membershipSchema,
  ...settingsSchema,
  ...organizationResolvers,
  ...campaignResolvers,
  ...assignmentResolvers,
  ...interactionStepResolvers,
  ...optOutResolvers,
  ...messageResolvers,
  ...campaignGroupResolvers,
  ...campaignVariableResolvers,
  ...campaignContactResolvers,
  ...campaignContactTagResolvers,
  ...cannedResponseResolvers,
  ...questionResponseResolvers,
  ...inviteResolvers,
  ...linkDomainResolvers,
  ...trollbotResolvers,
  ...externalListResolvers,
  ...externalSystemResolvers,
  ...externalSurveyQuestionResolvers,
  ...externalResponseOptionResolvers,
  ...externalActivistCodeResolvers,
  ...externalResultCodeResolvers,
  ...externalSyncConfigResolvers,
  ...messagingServiceResolvers,
  ...noticeResolvers,
  ...{ Date: GraphQLDate },
  ...{ JSON: GraphQLJSON },
  ...{ Phone: GraphQLPhone },
  ...{ Upload: GraphQLUpload },
  ...questionResolvers,
  ...conversationsResolver,
  ...rootMutations
};

export default resolvers;
