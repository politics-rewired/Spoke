import faker from "faker";
import { runTaskListOnce, WorkerOptions } from "graphile-worker";
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
import {
  CampaignContactRecord,
  OrganizationRecord,
  UserRecord
} from "../api/types";
import { withClient } from "../utils";
import queueAutoSendInitials from "./queue-autosend-initials";

describe("queue-autosend-initials", () => {
  let pool: Pool;
  let workerOptions: WorkerOptions;
  let texter: UserRecord;
  let organization: OrganizationRecord;

  beforeAll(async () => {
    pool = new Pool({ connectionString: config.TEST_DATABASE_URL });
    workerOptions = { pgPool: pool };
    await withClient(pool, async (client) => {
      // Set up campaign contact
      texter = await createTexter(client, {});
      organization = await createOrganization(client, {});
    });
  });

  afterAll(async () => {
    if (pool) await pool.end();
  });

  it("sends queues valid contacts when run", async () => {
    await withClient(pool, async (client) => {
      const campaign = await createCampaign(client, {
        organizationId: organization.id,
        isStarted: true,
        autosendUserId: texter.id,
        autosendStatus: "sending"
      });
      await createInteractionStep(client, {
        campaignId: campaign.id,
        scriptOptions: ["Have a text {firstName}"]
      });
      const assignment = await createAssignment(client, {
        campaignId: campaign.id,
        userId: texter.id
      });
      await Promise.all(
        [...Array(3)].map(() =>
          createCampaignContact(client, {
            campaignId: campaign.id,
            firstName: faker.name.firstName()
          })
        )
      );

      await client.query(`select graphile_worker.add_job($1)`, [
        "queue-autosend-initials"
      ]);

      await runTaskListOnce(
        workerOptions,
        {
          "queue-autosend-initials": queueAutoSendInitials
        },
        client
      );

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

      await pool.query(
        `delete from graphile_worker.jobs where task_identifier = ANY($1)`,
        [["queue-autosend-initials", "retry-interaction-step"]]
      );
    });
  });

  it("does not queue invalid contacts when run", async () => {
    await withClient(pool, async (client) => {
      const campaign = await createCampaign(client, {
        organizationId: organization.id,
        isStarted: true,
        autosendUserId: texter.id,
        autosendStatus: "unstarted"
      });
      await createInteractionStep(client, {
        campaignId: campaign.id,
        scriptOptions: ["Have a text {firstName}"]
      });
      const assignment = await createAssignment(client, {
        campaignId: campaign.id,
        userId: texter.id
      });
      await Promise.all(
        [...Array(3)].map(() =>
          createCampaignContact(client, {
            campaignId: campaign.id,
            firstName: faker.name.firstName()
          })
        )
      );

      await client.query(`select graphile_worker.add_job($1)`, [
        "queue-autosend-initials"
      ]);

      await runTaskListOnce(
        workerOptions,
        {
          "queue-autosend-initials": queueAutoSendInitials
        },
        client
      );

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

      await pool.query(
        `delete from graphile_worker.jobs where task_identifier = ANY($1)`,
        [["queue-autosend-initials", "retry-interaction-step"]]
      );
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
      const campaign = await createCampaign(client, {
        organizationId: organization.id,
        isStarted: true,
        autosendUserId: texter.id,
        autosendStatus: "unstarted"
      });

      await createInteractionStep(client, {
        campaignId: campaign.id,
        scriptOptions: ["Have a text {firstName}"]
      });

      await Promise.all(
        [...Array(6)].map(() =>
          createCampaignContact(client, {
            campaignId: campaign.id,
            firstName: faker.name.firstName()
          })
        )
      );

      const runQueueAutoSendInitials = async () => {
        await client.query(`select graphile_worker.add_job($1)`, [
          "queue-autosend-initials"
        ]);

        await runTaskListOnce(
          workerOptions,
          {
            "queue-autosend-initials": queueAutoSendInitials
          },
          client
        );
      };

      await runQueueAutoSendInitials();
      await runQueueAutoSendInitials();

      const {
        rowCount
      } = await client.query(
        `select * from graphile_worker.jobs where payload->>'campaignId' = $1`,
        [campaign.id]
      );
      expect(rowCount).toBe(6);

      await pool.query(
        `delete from graphile_worker.jobs where task_identifier = ANY($1)`,
        [["queue-autosend-initials", "retry-interaction-step"]]
      );
    });
  });
});
