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
    legalCompannyName
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
    .select("messaging_service_sid")
    .where({ service_type: "assemble-numbers" })
    .whereIn("organization_id", function whereIn(this: any) {
      this.select("organization_id")
        .from("user_organization")
        .where({ user_id: userId, role: "OWNER" });
    });
  if (organizationId !== undefined) {
    query.where({ organization_id: organizationId });
  }

  const profileIds: string[] = (await query).map(
    ({ messaging_service_sid }: { messaging_service_sid: string }) =>
      messaging_service_sid
  );
  const notifications: (
    | Register10DlcBrandNotice
    | undefined
  )[] = await Promise.all(
    profileIds.map(async (profileId: string) => {
      const payload = {
        operationName: "AnonGetTcr10DlcBrand",
        query: graphqlQuery,
        variables: {
          switchboardProfileId: profileId
        }
      };
      const response = await request
        .post(`https://api.portal.spokerewired.com/graphql`)
        .send(payload);

      if (!response.body.data.brand) {
        return {
          __typename: "Register10DlcBrandNotice",
          id: profileId,
          tcrBrandRegistrationUrl: `https://portal.spokerewired.com/10dlc-registration/${profileId}`
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
