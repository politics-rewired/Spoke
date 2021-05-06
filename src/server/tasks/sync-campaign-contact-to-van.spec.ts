import { Pool, PoolClient } from "pg";

import {
  createCompleteCampaign,
  createMessage
} from "../../../__test__/testbed-preparation/core";
import {
  createExternalResultCode,
  createExternalSystem
} from "../../../__test__/testbed-preparation/external-systems";
import { config } from "../../config";
import { MessageStatusType } from "../api/types";
import {
  CANVASSED_TAG_NAME,
  CanvassResultRow,
  fetchCanvassResponses,
  fetchOptOutCode,
  formatCanvassResponsePayload,
  hasPayload,
  VANCanvassResponse
} from "./sync-campaign-contact-to-van";

const createCampaignWithSystem = async (client: PoolClient) => {
  const {
    organization,
    campaign,
    assignments,
    contacts
  } = await createCompleteCampaign(client, {
    texters: 1,
    contacts: [{ messageStatus: MessageStatusType.Messaged }, {}]
  });

  const externalSystem = await createExternalSystem(client, {
    organizationId: organization.id
  });

  await client.query(
    `update campaign set external_system_id = $1 where id = $2`,
    [externalSystem.id, campaign.id]
  );

  return { organization, campaign, assignments, contacts, externalSystem };
};

describe("fetchCanvassResponses", () => {
  let pool: Pool;
  let client: PoolClient;

  beforeAll(async () => {
    pool = new Pool({ connectionString: config.TEST_DATABASE_URL });
    client = await pool.connect();
  });

  beforeEach(async () => {
    client.query(`begin`);
  });

  afterEach(async () => {
    client.query(`rollback`);
  });

  afterAll(async () => {
    if (client) client.release();
    if (pool) await pool.end();
  });

  test("generates empty row for messaged contact without survey responses", async () => {
    const {
      contacts: [contact],
      assignments: [assignment],
      externalSystem
    } = await createCampaignWithSystem(client);

    await createMessage(client, {
      campaignContactId: contact.id,
      assignmentId: assignment.id
    });

    const canvassResultsRaw = await fetchCanvassResponses(client, {
      systemId: externalSystem.id,
      contactId: contact.id
    });

    expect(canvassResultsRaw).toHaveLength(1);
    expect(canvassResultsRaw[0].activist_codes).toHaveLength(0);
    expect(canvassResultsRaw[0].result_codes).toHaveLength(0);
    expect(canvassResultsRaw[0].response_options).toHaveLength(0);
  });

  test("generates opt out result for opted out contact", async () => {
    const {
      contacts: [optedOutContact, optedInContact],
      externalSystem
    } = await createCampaignWithSystem(client);

    await client.query(
      `update campaign_contact set is_opted_out = true where id = $1`,
      [optedOutContact.id]
    );

    const externalResultCode = await createExternalResultCode(client, {
      systemId: externalSystem.id,
      name: CANVASSED_TAG_NAME
    });

    await client.query<{ id: string }>(
      `
        insert into public.external_sync_opt_out_configuration (system_id, external_result_code_id)
        values ($1, $2)
      `,
      [externalSystem.id, externalResultCode.id]
    );

    const optedOutOptOutCode = await fetchOptOutCode(client, {
      systemId: externalSystem.id,
      contactId: optedOutContact.id
    });

    const optedInOptOutCode = await fetchOptOutCode(client, {
      systemId: externalSystem.id,
      contactId: optedInContact.id
    });

    expect(optedOutOptOutCode).not.toBeNull();
    expect(optedOutOptOutCode).toBe(externalResultCode.external_id);

    expect(optedInOptOutCode).toBeNull();
  });
});

describe("formatCanvassResponsePayload", () => {
  const phoneId = 5432;
  const phoneNumber = "+16463893770";
  const canvassedResultCode = 1234;

  test("correctly formats an opted-out contact without survey responses", () => {
    const optOutResultCode = 4321;

    const canvassResultRow: CanvassResultRow = {
      canvassed_at: "2021-01-21",
      result_codes: [],
      activist_codes: [],
      response_options: []
    };
    const canvassResponse = formatCanvassResponsePayload({
      canvassResultRow,
      phoneId,
      phoneNumber,
      canvassedResultCode,
      optOutResultCode
    });
    expect(canvassResponse).toHaveLength(1);
    expect(canvassResponse[0].responses).toBeNull();
    expect(canvassResponse[0].resultCodeId).toBe(optOutResultCode);
  });

  test("correctly formats a messaged contact without survey responses", () => {
    const optOutResultCode = null;

    const canvassResultRow: CanvassResultRow = {
      canvassed_at: "2021-01-21",
      result_codes: [],
      activist_codes: [],
      response_options: []
    };
    const canvassResponse = formatCanvassResponsePayload({
      canvassResultRow,
      phoneId,
      phoneNumber,
      canvassedResultCode,
      optOutResultCode
    });
    expect(canvassResponse).toHaveLength(1);
    expect(canvassResponse[0].responses).toBeNull();
    expect(canvassResponse[0].resultCodeId).toBe(canvassedResultCode);
  });

  test("correctly formats a contact with both survey responses and a canvass result code", () => {
    const optOutResultCode = null;

    const canvassResultRow: CanvassResultRow = {
      canvassed_at: "2021-01-21",
      result_codes: [{ result_code_id: 777 }],
      activist_codes: [],
      response_options: [{ survey_question_id: 999, response_option_id: 888 }]
    };
    const canvassResponse = formatCanvassResponsePayload({
      canvassResultRow,
      phoneId,
      phoneNumber,
      canvassedResultCode,
      optOutResultCode
    });
    expect(canvassResponse).toHaveLength(1);
    expect(canvassResponse[0].responses).toHaveLength(1);
    expect(canvassResponse[0].resultCodeId).toBeNull();
  });

  test("correctly formats a contact with both survey responses and an opt-out result code", () => {
    const optOutResultCode = 4321;

    const canvassResultRow: CanvassResultRow = {
      canvassed_at: "2021-01-21",
      result_codes: [],
      activist_codes: [],
      response_options: [{ survey_question_id: 999, response_option_id: 888 }]
    };
    const canvassResponse = formatCanvassResponsePayload({
      canvassResultRow,
      phoneId,
      canvassedResultCode,
      optOutResultCode
    });
    expect(canvassResponse).toHaveLength(2);
    expect(canvassResponse[0].responses).toHaveLength(1);
    expect(canvassResponse[0].resultCodeId).toBeNull();
    expect(canvassResponse[1].responses).toBeNull();
    expect(canvassResponse[1].resultCodeId).toBe(optOutResultCode);
  });
});

describe("hasPayload", () => {
  test("returns false for empty responses", () => {
    const nullResponsesResponse: VANCanvassResponse = {
      canvassContext: {
        phoneId: 1234,
        phone: {
          dialingPrefix: "1",
          phoneNumber: "+16463893770"
        },
        dateCanvassed: "2021-01-21"
      },
      resultCodeId: null,
      responses: null
    };
    expect(hasPayload(nullResponsesResponse)).toBe(false);

    const emptyResponsesResponse: VANCanvassResponse = {
      canvassContext: {
        phoneId: 1234,
        phone: {
          dialingPrefix: "1",
          phoneNumber: "+16463893770"
        },
        dateCanvassed: "2021-01-21"
      },
      resultCodeId: null,
      responses: []
    };
    expect(hasPayload(emptyResponsesResponse)).toBe(false);
  });

  test("returns true for canvass response with result code", () => {
    const resultCodeResponse: VANCanvassResponse = {
      canvassContext: {
        phoneId: 1234,
        phone: {
          dialingPrefix: "1",
          phoneNumber: "+16463893770"
        },
        dateCanvassed: "2021-01-21"
      },
      resultCodeId: 5432,
      responses: null
    };
    expect(hasPayload(resultCodeResponse)).toBe(true);
  });

  test("returns true for canvass response with responses", () => {
    const resultCodeResponse: VANCanvassResponse = {
      canvassContext: {
        phoneId: 1234,
        phone: {
          dialingPrefix: "1",
          phoneNumber: "+16463893770"
        },
        dateCanvassed: "2021-01-21"
      },
      resultCodeId: null,
      responses: [
        { type: "ActivistCode", activistCodeId: 1234, action: "Apply" }
      ]
    };
    expect(hasPayload(resultCodeResponse)).toBe(true);
  });
});
