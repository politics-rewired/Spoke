import faker from "faker";
import { runTaskListOnce } from "graphile-worker";
import type { PoolClient } from "pg";
import { Pool } from "pg";

import {
  createAssignment,
  createCampaign,
  createCampaignContact,
  createInteractionStep,
  createOrganization,
  createTexter
} from "../../../__test__/testbed-preparation/core";
import { config } from "../../config";
import type {
  CampaignContactRecord,
  OrganizationRecord,
  UserRecord
} from "../api/types";
import { AutosendStatus, MessageStatusType } from "../api/types";
import { withClient } from "../utils";
import {
  QUEUE_AUTOSEND_ORGANIZATION_INITIALS_TASK_IDENTIFIER,
  queueAutoSendOrganizationInitials
} from "./queue-autosend-initials";

const TASK_IDENTIFIER = QUEUE_AUTOSEND_ORGANIZATION_INITIALS_TASK_IDENTIFIER;

interface SetUpAutosendingOptions {
  organizationId: number;
  autosendUserId: number;
  autosendStatus: AutosendStatus;
  unmessagedCount: number;
  messagedCount?: number;
}

const setUpAutosending = async (
  client: PoolClient,
  options: SetUpAutosendingOptions
) => {
  const {
    organizationId,
    autosendUserId,
    autosendStatus,
    unmessagedCount,
    messagedCount = 0
  } = options;

  const campaign = await createCampaign(client, {
    organizationId,
    isStarted: true,
    autosendUserId,
    autosendStatus
  });
  await createInteractionStep(client, {
    campaignId: campaign.id,
    scriptOptions: ["Have a text {firstName}"]
  });
  const assignment = await createAssignment(client, {
    campaignId: campaign.id,
    userId: autosendUserId
  });
  const messagedContacts = await Promise.all(
    [...Array(messagedCount)].map(() =>
      createCampaignContact(client, {
        campaignId: campaign.id,
        firstName: faker.name.firstName(),
        messageStatus: MessageStatusType.Messaged
      })
    )
  );
  const unmessagedContacts = await Promise.all(
    [...Array(unmessagedCount)].map(() =>
      createCampaignContact(client, {
        campaignId: campaign.id,
        firstName: faker.name.firstName()
      })
    )
  );

  return { campaign, assignment, messagedContacts, unmessagedContacts };
};

interface RunQueueAutosendOptions {
  client: PoolClient;
  pool: Pool;
  organizationId: number;
}

const runQueueAutosend = async ({
  client,
  pool,
  organizationId
}: RunQueueAutosendOptions) => {
  await client.query(`select graphile_worker.add_job($1, $2)`, [
    TASK_IDENTIFIER,
    { organization_id: organizationId }
  ]);

  await runTaskListOnce(
    { pgPool: pool },
    { [TASK_IDENTIFIER]: queueAutoSendOrganizationInitials },
    client
  );
};

const cleanUp = async (pool: Pool) => {
  const taskIdentifiers = [TASK_IDENTIFIER, "retry-interaction-step"];
  await pool.query(
    `delete from graphile_worker.jobs where task_identifier = ANY($1)`,
    [taskIdentifiers]
  );
};

describe("queue-autosend-organization-initials", () => {
  let pool: Pool;
  let texter: UserRecord;
  let organization: OrganizationRecord;

  beforeAll(async () => {
    pool = new Pool({ connectionString: config.TEST_DATABASE_URL });
    await withClient(pool, async (client) => {
      // Set up campaign contact
      texter = await createTexter(client, {});
      organization = await createOrganization(client, { autosending_mps: 5 });
    });
  });

  afterEach(async () => {
    await cleanUp(pool);
  });

  afterAll(async () => {
    if (pool) await pool.end();
  });

  it("sends queues valid contacts when run", async () => {
    await withClient(pool, async (client) => {
      const { campaign, assignment } = await setUpAutosending(client, {
        organizationId: organization.id,
        autosendUserId: texter.id,
        autosendStatus: AutosendStatus.Sending,
        unmessagedCount: 3
      });

      await runQueueAutosend({ client, pool, organizationId: organization.id });

      const { rows: contacts } = await client.query<CampaignContactRecord>(
        `select * from campaign_contact where campaign_id = $1`,
        [campaign.id]
      );
      expect(contacts).toHaveLength(3);
      expect(contacts[0].assignment_id).toBe(assignment.id);

      const {
        rowCount
      } = await client.query(
        `select * from graphile_worker.jobs where payload->>'campaignId' = $1`,
        [campaign.id]
      );
      expect(rowCount).toBe(3);
    });
  });

  it("does not queue invalid contacts when run", async () => {
    await withClient(pool, async (client) => {
      const { campaign, assignment } = await setUpAutosending(client, {
        organizationId: organization.id,
        autosendUserId: texter.id,
        autosendStatus: AutosendStatus.Unstarted,
        unmessagedCount: 3
      });

      await runQueueAutosend({ client, pool, organizationId: organization.id });

      const { rows: contacts } = await client.query<CampaignContactRecord>(
        `select * from campaign_contact where campaign_id = $1`,
        [campaign.id]
      );
      expect(contacts).toHaveLength(3);
      for (const contact of contacts) {
        expect(contact.assignment_id).not.toBe(assignment.id);
        expect(contact.assignment_id).toBeNull();
      }

      const {
        rowCount
      } = await client.query(
        `select * from graphile_worker.jobs where payload->>'campaignId' = $1`,
        [campaign.id]
      );
      expect(rowCount).toBe(0);
    });
  });

  // This test was added when we changed autoassign to steal assignments from users
  // Before that, part of the mechanism preventing duplicate sends was that the
  // contact got assigned to the autosend user before getting queued, so a
  // subsequent run wouldn't pick them up
  // Now, that doesn't happen, so this test seemed like a useful check since we're
  // only relying on job_key
  it("does not double queue contacts after change to include assigned messages", async () => {
    await withClient(pool, async (client) => {
      const { campaign } = await setUpAutosending(client, {
        organizationId: organization.id,
        autosendUserId: texter.id,
        autosendStatus: AutosendStatus.Sending,
        unmessagedCount: 6
      });

      await runQueueAutosend({ client, pool, organizationId: organization.id });
      await runQueueAutosend({ client, pool, organizationId: organization.id });

      const {
        rowCount
      } = await client.query(
        `select * from graphile_worker.jobs where payload->>'campaignId' = $1`,
        [campaign.id]
      );
      expect(rowCount).toBe(6);
    });
  });
});
