import faker from "faker";
import { PoolClient } from "pg";

import { Assignment } from "../../src/api/assignment";
import { Campaign } from "../../src/api/campaign";
import { CampaignContact } from "../../src/api/campaign-contact";
import { Message } from "../../src/api/message";
import { Organization } from "../../src/api/organization";
import { User } from "../../src/api/user";
import {
  AssignmentRecord,
  CampaignContactRecord,
  CampaignRecord,
  MessageRecord,
  MessageSendStatus,
  MessageStatusType,
  OrganizationRecord,
  UserRecord
} from "../../src/server/api/types";

export type CreateOrganizationOptions = Partial<
  Pick<Organization, "name"> & { uuid: string; features: Record<string, any> }
>;

export const createOrganization = async (
  client: PoolClient,
  options: CreateOrganizationOptions
) =>
  client
    .query<OrganizationRecord>(
      `
        insert into organization (name, uuid, features)
        values ($1, $2, $3)
        returning *
      `,
      [
        options.name ?? faker.company.companyName(),
        options.uuid ?? faker.random.uuid(),
        JSON.stringify(options.features ?? {})
      ]
    )
    .then(({ rows: [organization] }) => organization);

export type CreateTexterOptions = Partial<
  Pick<User, "firstName" | "lastName" | "cell" | "email"> & {
    auth0Id: string;
  }
>;

export const createTexter = async (
  client: PoolClient,
  options: CreateTexterOptions
) =>
  client
    .query<UserRecord>(
      `
        insert into public.user (auth0_id, first_name, last_name, cell, email)
        values ($1, $2, $3, $4, $5)
        returning *
      `,
      [
        options.auth0Id ?? faker.random.alphaNumeric(12),
        options.firstName ?? faker.name.firstName(),
        options.lastName ?? faker.name.lastName(),
        options.cell ?? faker.phone.phoneNumber("+1###########"),
        options.email ?? faker.internet.email()
      ]
    )
    .then(({ rows: [user] }) => user);

export type CreateCampaignOptions = Partial<
  Pick<
    Campaign,
    | "title"
    | "description"
    | "isStarted"
    | "isArchived"
    | "textingHoursStart"
    | "textingHoursEnd"
    | "timezone"
    | "isAutoassignEnabled"
    | "isAssignmentLimitedToTeams"
    | "landlinesFiltered"
  > & {
    creatorId: number;
    repliesStaleAfterMinutes: number;
    externalSystemId: string;
  }
> & {
  organizationId: number;
};

export const createCampaign = async (
  client: PoolClient,
  options: CreateCampaignOptions
) => {
  return client
    .query<CampaignRecord>(
      `
      insert into public.campaign (
        organization_id,
        title,
        description,
        is_started,
        is_archived,
        use_dynamic_assignment,
        logo_image_url,
        intro_html,
        primary_color,
        texting_hours_start,
        texting_hours_end,
        timezone,
        creator_id,
        is_autoassign_enabled,
        limit_assignment_to_teams,
        replies_stale_after_minutes,
        landlines_filtered,
        external_system_id
      ) values ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18)
      returning *
    `,
      [
        options.organizationId,
        options.title ?? faker.company.companyName(),
        options.description ?? faker.lorem.sentence(),
        options.isStarted ?? true,
        options.isArchived ?? false,
        false,
        null,
        null,
        null,
        options.textingHoursStart ?? 9,
        options.textingHoursEnd ?? 21,
        options.timezone ?? faker.address.timeZone(),
        options.creatorId ?? null,
        options.isAutoassignEnabled ?? false,
        options.isAssignmentLimitedToTeams ?? false,
        options.repliesStaleAfterMinutes ?? null,
        options.landlinesFiltered ?? false,
        options.externalSystemId ?? null
      ]
    )
    .then(({ rows: [campaign] }) => campaign);
};

export type CreateCampaignContactOptions = Partial<
  Pick<
    CampaignContact,
    | "assignmentId"
    | "external_id"
    | "firstName"
    | "lastName"
    | "cell"
    | "zip"
    | "customFields"
    | "timezone"
  > & {
    isOptedOut: boolean;
    archived: boolean;
    messageStatus: MessageStatusType;
  }
> & { campaignId: number };

export const createCampaignContact = async (
  client: PoolClient,
  options: CreateCampaignContactOptions
) =>
  client
    .query<CampaignContactRecord>(
      `
        insert into public.campaign_contact (
          campaign_id,
          assignment_id,
          external_id,
          first_name,
          last_name,
          cell,
          zip,
          custom_fields,
          message_status,
          is_opted_out,
          timezone,
          archived
        ) values ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
        returning *
      `,
      [
        options.campaignId,
        options.assignmentId ?? null,
        options.external_id ?? "",
        options.firstName ?? faker.name.firstName(),
        options.lastName ?? faker.name.lastName(),
        options.cell ?? faker.phone.phoneNumber("+1###########"),
        options.zip ?? faker.address.zipCode(),
        JSON.stringify(options.customFields ?? "{}"),
        options.messageStatus ?? MessageStatusType.NeedsMessage,
        options.isOptedOut ?? false,
        options.timezone ?? faker.address.timeZone(),
        options.archived ?? false
      ]
    )
    .then(({ rows: [campaignContact] }) => campaignContact);

export type CreateAssignmentOptions = {
  userId: number;
  campaignId: number;
} & Partial<Pick<Assignment, "maxContacts">>;

export const createAssignment = async (
  client: PoolClient,
  options: CreateAssignmentOptions
) =>
  client
    .query<AssignmentRecord>(
      `
        insert into public.assignment (user_id, campaign_id, max_contacts)
        values ($1, $2, $3)
        returning *
      `,
      [options.userId, options.campaignId, options.maxContacts ?? null]
    )
    .then(({ rows: [assignment] }) => assignment);

export type CreateMessageOptions = {
  campaignContactId: number;
  assignmentId: number;
} & Partial<
  Pick<Message, "text" | "sendStatus"> & {
    contactNumber: string;
    isFromContact: boolean;
    userId: number;
  }
>;

export const createMessage = async (
  client: PoolClient,
  options: CreateMessageOptions
) =>
  client
    .query<MessageRecord>(
      `
        insert into public.message (campaign_contact_id, contact_number, assignment_id, is_from_contact, text, send_status, user_id)
        values ($1, $2, $3, $4, $5, $6, $7)
        returning *
      `,
      [
        options.campaignContactId,
        options.contactNumber ?? faker.phone.phoneNumber("+1##########"),
        options.assignmentId,
        options.isFromContact ?? false,
        options.text ?? faker.lorem.paragraph(),
        options.sendStatus ?? MessageSendStatus.Delivered,
        options.userId ?? null
      ]
    )
    .then(({ rows: [message] }) => message);

export interface CreateCompleteCampaignOptions {
  organization?: CreateOrganizationOptions;
  campaign?: Omit<CreateCampaignOptions, "organizationId">;
  texters?: number | CreateTexterOptions[];
  contacts?: number | Omit<CreateCampaignContactOptions, "campaignId">[];
}

export const createCompleteCampaign = async (
  client: PoolClient,
  options: CreateCompleteCampaignOptions
) => {
  const organization = await createOrganization(
    client,
    options.organization ?? {}
  );

  const campaign = await createCampaign(client, {
    ...(options.campaign ?? {}),
    organizationId: organization.id
  });

  const texterOptions = options.texters ?? 0;
  const texters = await Promise.all(
    typeof texterOptions === "number"
      ? [...Array(texterOptions)].map((_) => createTexter(client, {}))
      : texterOptions.map((texterOption) => createTexter(client, texterOption))
  );

  const assignments = await Promise.all(
    texters.map((texter) =>
      createAssignment(client, { userId: texter.id, campaignId: campaign.id })
    )
  );

  const contactOptions = options.contacts ?? 0;
  const contacts = await Promise.all(
    typeof contactOptions === "number"
      ? [...Array(contactOptions)].map((_) =>
          createCampaignContact(client, { campaignId: campaign.id })
        )
      : contactOptions.map((contactOption) =>
          createCampaignContact(client, {
            ...contactOption,
            campaignId: campaign.id
          })
        )
  );

  return { organization, campaign, texters, assignments, contacts };
};
