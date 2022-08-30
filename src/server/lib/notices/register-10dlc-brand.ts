import request from "superagent";

import type { Register10DlcBrandNotice } from "../../../api/notice";
import { r } from "../../models";
import type { OrgLevelNotificationGetter } from "./types";

const graphqlQuery = `
  query AnonGetTcr10DlcSurvey($switchboardProfileId: String!) {
    billingAccountId: billingAccountIdBySwitchboardProfileId(
      switchboardProfileId: $switchboardProfileId
    )
    billingAccountName: billingAccountNameBySwitchboardProfileId(
      switchboardProfileId: $switchboardProfileId
    )
    survey: tcr10DlcSurveyBySwitchboardProfileId(
      switchboardProfileId: $switchboardProfileId
    ) {
      ...Tcr10DlcSurveyInfo
      __typename
    }
  }

  fragment Tcr10DlcSurveyInfo on Tcr10DlcSurvey {
    id
    nodeId
    legalCompanyName
    dba
    entityForm
    industry
    website
    usFein
    address
    city
    state
    postalCode
    email
    phoneNumber
    __typename
  }
`;

export const get10DlcBrandNotices: OrgLevelNotificationGetter = async (
  userId,
  organizationId
) => {
  const query = r
    .knex("messaging_service")
    .join(
      "user_organization",
      "user_organization.organization_id",
      "messaging_service.organization_id"
    )
    .select(["messaging_service_sid", r.knex.raw("array_agg(role) as roles")])
    .groupBy("messaging_service_sid")
    .where({
      service_type: "assemble-numbers",
      user_id: userId
    })
    .whereIn("role", ["OWNER", "ADMIN"]);
  if (organizationId !== undefined) {
    query.where({ "user_organization.organization_id": organizationId });
  }

  const profiles: {
    messaging_service_sid: string;
    roles: string[];
  }[] = await query;
  const notifications: (
    | Register10DlcBrandNotice
    | undefined
  )[] = await Promise.all(
    profiles.map(async ({ messaging_service_sid, roles }) => {
      const payload = {
        operationName: "AnonGetTcr10DlcSurvey",
        query: graphqlQuery,
        variables: {
          switchboardProfileId: messaging_service_sid
        }
      };
      const response = await request
        .post(`https://portal-api.spokerewired.com/graphql`)
        .send(payload);

      if (!response.body.data.survey) {
        return {
          __typename: "Register10DlcBrandNotice",
          id: messaging_service_sid,
          tcrBrandRegistrationUrl: roles.includes("OWNER")
            ? `https://portal.spokerewired.com/10dlc-registration/${messaging_service_sid}`
            : null
        };
      }
      return undefined;
    })
  );

  const result = notifications.reduce<Register10DlcBrandNotice[]>(
    (acc, notification) =>
      notification !== undefined ? [...acc, notification] : acc,
    []
  );

  return result;
};

export default get10DlcBrandNotices;
