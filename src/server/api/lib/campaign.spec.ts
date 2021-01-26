import { Pool, PoolClient } from "pg";

import {
  createCompleteCampaign,
  createMessage
} from "../../../../__test__/testbed-preparation/core";
import { config } from "../../../config";
import { getDeliverabilityStats } from "./campaign";

describe("getDeliverabilityStats", () => {
  let pool: Pool;
  let client: PoolClient;

  beforeAll(async () => {
    pool = new Pool({ connectionString: config.TEST_DATABASE_URL });
    client = await pool.connect();
  });

  afterAll(async () => {
    if (client) client.release();
    if (pool) await pool.end();
  });

  test("generates correct stats for mixed errors", async () => {
    const {
      campaign,
      contacts: [contact],
      assignments: [assignment]
    } = await createCompleteCampaign(client, { texters: 1, contacts: 1 });
    const message = {
      campaignContactId: contact.id,
      assignmentId: assignment.id,
      sendStatus: "ERROR"
    };

    const createErrorMessage = async (count: number, errorCode?: string) =>
      Promise.all(
        [...Array(count)].map((_) =>
          createMessage(client, {
            ...message,
            errorCodes: errorCode ? [errorCode] : undefined
          })
        )
      );

    const errors: [number, string | null][] = [
      [4, "30001"],
      [3, "30004"],
      [2, "30011"],
      [3, null]
    ];

    for (const [count, errorCode] of errors) {
      await createErrorMessage(count, errorCode ?? undefined);
    }

    const stats = await getDeliverabilityStats(campaign.id);
    expect(stats.deliveredCount).toBe(0);
    expect(stats.sentCount).toBe(0);
    expect(stats.errorCount).toBe(12);
    expect(stats.specificErrors).toHaveLength(4);

    errors.forEach(([count, errorCode]) => {
      // See: https://medium.com/@andrei.pfeiffer/jest-matching-objects-in-array-50fe2f4d6b98
      expect(stats.specificErrors).toEqual(
        expect.arrayContaining([expect.objectContaining({ count, errorCode })])
      );
    });
  });

  test("generates correct stats for mixed null and empty list error codes", async () => {
    const {
      campaign,
      contacts: [contact],
      assignments: [assignment]
    } = await createCompleteCampaign(client, { texters: 1, contacts: 1 });

    await createMessage(client, {
      campaignContactId: contact.id,
      assignmentId: assignment.id,
      sendStatus: "ERROR",
      errorCodes: []
    });

    await createMessage(client, {
      campaignContactId: contact.id,
      assignmentId: assignment.id,
      sendStatus: "ERROR",
      errorCodes: undefined
    });

    const stats = await getDeliverabilityStats(campaign.id);

    expect(stats.deliveredCount).toBe(0);
    expect(stats.sentCount).toBe(0);
    expect(stats.errorCount).toBe(2);
    expect(stats.specificErrors).toHaveLength(1);
    expect(stats.specificErrors[0].errorCode).toBeNull();
  });
});
