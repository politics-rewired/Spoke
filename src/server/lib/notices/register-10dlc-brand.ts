import request from "superagent";

import { r } from "../../models";
import type { OrgLevelNotificationGetter } from "./types";

const PORTAL_API_URL = "https://portal-api.spokerewired.com/graphql";

const fetchBillingAccountQuery = `
  query GetBillingAccountBySwitchboardProfileId($switchboardProfileId: UUID!) {
    billingAccount: billingAccountBySwitchboardProfileId(
      switchboardProfileId: $switchboardProfileId
    ) {
      id
      __typename
    }
  }
`;

const fetchBrandQuery = `
  query AnonGetTcr10DlcBrandByBillingAccountId($billingAccountId: UUID!) {
    brand: brandByBillingAccountId(billingAccountId: $billingAccountId) {
    id
    state
    campaigns: tcr10DlcCampaignsByBrandId {
      nodes {
        id
        state
        __typename
      }
    }
    __typename
    }
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
      user_id: userId,
      active: true
    })
    .whereIn("role", ["OWNER", "ADMIN"]);
  if (organizationId !== undefined) {
    query.where({ "user_organization.organization_id": organizationId });
  }

  const profiles: {
    messaging_service_sid: string;
    roles: string[];
  }[] = await query;
  const ownedProfiles = profiles.filter(({ roles }) => roles.includes("OWNER"));

  const registeredProfiles: Array<boolean> = await Promise.all(
    ownedProfiles.map(async ({ messaging_service_sid }) => {
      const payload = {
        operationName: "GetBillingAccountBySwitchboardProfileId",
        query: fetchBillingAccountQuery,
        variables: {
          switchboardProfileId: messaging_service_sid
        }
      };

      const billingAccountResponse = await request
        .post(PORTAL_API_URL)
        .send(payload);

      if (billingAccountResponse.body?.data?.billingAccount?.id) {
        const brandPayload = {
          operationName: "AnonGetTcr10DlcBrandByBillingAccountId",
          query: fetchBrandQuery,
          variables: {
            billingAccountId: billingAccountResponse.body.data.billingAccount.id
          }
        };

        const brandResponse = await request
          .post(PORTAL_API_URL)
          .send(brandPayload);

        if (brandResponse.body.data?.brand?.campaigns?.nodes) {
          return brandResponse.body.data?.brand?.campaigns?.nodes.some(
            ({ state }: { state: string }) => state === "REGISTERED"
          );
        }
      }

      return false;
    })
  );

  // Check if there are no registered profiles
  if (registeredProfiles.every((registered) => !registered)) {
    const { messaging_service_sid: messagingServiceSid } = ownedProfiles[0];
    return [
      {
        __typename: "Register10DlcBrandNotice",
        id: messagingServiceSid,
        tcrBrandRegistrationUrl: `https://portal.spokerewired.com/10dlc-registration/${messagingServiceSid}`
      }
    ];
  }

  return [];
};

export default get10DlcBrandNotices;
