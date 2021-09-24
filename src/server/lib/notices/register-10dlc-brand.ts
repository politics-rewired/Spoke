import request from "superagent";

import { Register10DlcBrandNotice } from "../../../api/notice";
import { r } from "../../models";
import { OrgLevelNotificationGetter } from "./types";

const graphqlQuery = `
  query AnonGetTcr10DlcBrand($switchboardProfileId: String!) {
    billingAccountId: billingAccountIdBySwitchboardProfileId(
      switchboardProfileId: $switchboardProfileId
    )
    billingAccountName: billingAccountNameBySwitchboardProfileId(
      switchboardProfileId: $switchboardProfileId
    )
    brand: tcr10DlcBrandBySwitchboardProfileId(
      switchboardProfileId: $switchboardProfileId
    ) {
      ...Tcr10DlcBrandInfo
      __typename
    }
  }

  fragment Tcr10DlcBrandInfo on Tcr10DlcBrand {
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
        operationName: "AnonGetTcr10DlcBrand",
        query: graphqlQuery,
        variables: {
          switchboardProfileId: messaging_service_sid
        }
      };
      const response = await request
        .post(`https://api.portal.spokerewired.com/graphql`)
        .send(payload);

      if (!response.body.data.brand) {
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
