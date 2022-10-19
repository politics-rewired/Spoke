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
  CampaignRecord,
  OrganizationRecord,
  UserRecord
} from "../api/types";
import { AutosendStatus, MessageStatusType } from "../api/types";
import { withClient } from "../utils";
import {
  QUEUE_AUTOSEND_ORGANIZATION_INITIALS_TASK_IDENTIFIER,
  queueAutoSendOrganizationInitials
} from "./queue-autosend-initials";
import { TASK_IDENTIFIER as RETRY_ISTEP_IDENTIFIER } from "./retry-interaction-step";

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

const fetchTaskCount = async (client: PoolClient, campaignId: number) =>
  client
    .query(
      `select * from graphile_worker.jobs where task_identifier = $1 and payload->>'campaignId' = $2`,
      [RETRY_ISTEP_IDENTIFIER, campaignId]
    )
    .then(({ rowCount }) => rowCount);

const runRetryInteractionSteps = async (
  client: PoolClient,
  campaignId: number
) => {
  await client.query<{ id: number }>(
    `
      with cc_ids as (
        delete from graphile_worker.jobs
        where true
          and task_identifier = $1
          and payload->>'campaignId' = $2
        returning (payload->>'campaignContactId')::integer as id
      )
      update campaign_contact
      set message_status = 'messaged'
      where id in (select id from cc_ids)
    `,
    [RETRY_ISTEP_IDENTIFIER, campaignId]
  );
};

const cleanUp = async (pool: Pool) => {
  const taskIdentifiers = [TASK_IDENTIFIER, RETRY_ISTEP_IDENTIFIER];
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

      const taskCount = await fetchTaskCount(client, campaign.id);
      expect(taskCount).toBe(3);
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

      const taskCount = await fetchTaskCount(client, campaign.id);
      expect(taskCount).toBe(0);
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

      const taskCount = await fetchTaskCount(client, campaign.id);
      expect(taskCount).toBe(6);
    });
  });

  it("only queues up to the limit and then pauses", async () => {
    await withClient(pool, async (client) => {
      const unmessagedCount = 10;
      const limit = 5;

      const { campaign, unmessagedContacts } = await setUpAutosending(client, {
        organizationId: organization.id,
        autosendUserId: texter.id,
        autosendStatus: AutosendStatus.Sending,
        unmessagedCount
      });

      const unmessagedContactIds = unmessagedContacts.map((cc) => cc.id);
      unmessagedContactIds.sort();

      await client.query(
        `
          update campaign
          set
            autosend_limit = $1,
            autosend_limit_max_contact_id = $2
          where id = $3
        `,
        [limit, unmessagedContactIds[limit - 1], campaign.id]
      );

      await runQueueAutosend({ client, pool, organizationId: organization.id });

      const taskCount = await fetchTaskCount(client, campaign.id);
      expect(taskCount).toBe(limit);

      await runRetryInteractionSteps(client, campaign.id);
      await runQueueAutosend({ client, pool, organizationId: organization.id });

      const {
        rows: [finalCampaign]
      } = await client.query<CampaignRecord>(
        `select autosend_status from campaign where id = $1`,
        [campaign.id]
      );
      expect(finalCampaign.autosend_status).toBe(AutosendStatus.Paused);
    });
  });

  it("marks completed campaign with autosend limit as completed", async () => {
    await withClient(pool, async (client) => {
      const messagedCount = 25;

      const { campaign, messagedContacts } = await setUpAutosending(client, {
        organizationId: organization.id,
        autosendUserId: texter.id,
        autosendStatus: AutosendStatus.Sending,
        messagedCount,
        unmessagedCount: 0
      });

      const maxMessagedContactId = Math.max(
        ...messagedContacts.map((cc) => cc.id)
      );

      await client.query(
        `
          update campaign
          set
            autosend_limit = $1,
            autosend_limit_max_contact_id = $2
          where id = $3
        `,
        [messagedCount, maxMessagedContactId, campaign.id]
      );

      await runQueueAutosend({ client, pool, organizationId: organization.id });
      await runRetryInteractionSteps(client, campaign.id);
      await runQueueAutosend({ client, pool, organizationId: organization.id });

      const {
        rows: [finalCampaign]
      } = await client.query<CampaignRecord>(
        `select * from campaign where id = $1`,
        [campaign.id]
      );
      expect(finalCampaign.autosend_status).toBe(AutosendStatus.Complete);
    });
  });
});
