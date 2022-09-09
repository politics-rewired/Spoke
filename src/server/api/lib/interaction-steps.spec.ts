import { Pool } from "pg";

import {
  createCampaignContact,
  createCompleteCampaign,
  createInteractionStep,
  createQuestionResponse
} from "../../../../__test__/testbed-preparation/core";
import type { InteractionStepWithChildren } from "../../../api/interaction-step";
import { config } from "../../../config";
import { withClient } from "../../utils";
import type { InteractionStepRecord } from "../types";
import { persistInteractionStepTree } from "./interaction-steps";

const emptyStep = {
  questionText: "",
  answerOption: "",
  scriptOptions: [""],
  answerActions: "'",
  interactionSteps: [],
  isDeleted: false,
  createdAt: "2021-01-27T00:00:00Z"
};

describe("persistInteractionStepTree", () => {
  let pool: Pool;

  beforeAll(async () => {
    pool = new Pool({ connectionString: config.TEST_DATABASE_URL });
  });

  afterAll(async () => {
    if (pool) pool.end();
  });

  test("adds new interaction steps", async () => {
    await withClient(pool, async (client) => {
      const { campaign } = await createCompleteCampaign(client, {});
      const rootStep: InteractionStepWithChildren = {
        ...emptyStep,
        id: "new1",
        parentInteractionId: null
      };

      await persistInteractionStepTree(campaign.id, rootStep, {
        is_started: campaign.is_started
      });

      const {
        rows: [rootStepRecord]
      } = await client.query<InteractionStepRecord>(
        `select * from interaction_step where campaign_id = $1`,
        [campaign.id]
      );

      expect(rootStepRecord).toHaveProperty("id");
      expect(rootStepRecord.is_deleted).toBe(false);
      expect(rootStepRecord.parent_interaction_id).toBeNull();
    });
  });

  test("removes deleted interaction steps", async () => {
    await withClient(pool, async (client) => {
      const { campaign } = await createCompleteCampaign(client, {});
      const rootStep = await createInteractionStep(client, {
        campaignId: campaign.id
      });

      const stepToDelete: InteractionStepWithChildren = {
        ...emptyStep,
        id: `${rootStep.id}`,
        parentInteractionId: `${rootStep.parent_interaction_id}`,
        isDeleted: true
      };

      await persistInteractionStepTree(campaign.id, stepToDelete, {
        is_started: campaign.is_started
      });

      const {
        rows: [deletedStep]
      } = await client.query<InteractionStepRecord>(
        `select * from interaction_step where id = $1`,
        [rootStep.id]
      );

      expect(deletedStep).toBeUndefined();
    });
  });

  test("updates modified interaction steps", async () => {
    await withClient(pool, async (client) => {
      const { campaign } = await createCompleteCampaign(client, {});
      const rootStep = await createInteractionStep(client, {
        campaignId: campaign.id
      });

      const NEW_QUESTION = "Did it update?";

      const stepToUpdate: InteractionStepWithChildren = {
        ...emptyStep,
        id: `${rootStep.id}`,
        parentInteractionId: `${rootStep.parent_interaction_id}`,
        questionText: NEW_QUESTION
      };

      await persistInteractionStepTree(campaign.id, stepToUpdate, {
        is_started: campaign.is_started
      });

      const {
        rows: [deletedStep]
      } = await client.query<InteractionStepRecord>(
        `select * from interaction_step where id = $1`,
        [rootStep.id]
      );

      expect(deletedStep.question).toEqual(NEW_QUESTION);
      expect(deletedStep.is_deleted).toBe(false);
    });
  });

  test("deletes old root interaction step when saving new tree", async () => {
    await withClient(pool, async (client) => {
      const { campaign } = await createCompleteCampaign(client, {});
      const oldRootStep = await createInteractionStep(client, {
        campaignId: campaign.id,
        createdAt: "2021-01-28T00:00:00Z"
      });
      const oldChildStep = await createInteractionStep(client, {
        campaignId: campaign.id,
        parentInteractionId: oldRootStep.id,
        createdAt: "2021-01-28T00:00:01Z"
      });

      const stepToPersist: InteractionStepWithChildren = {
        ...emptyStep,
        id: "new5432",
        parentInteractionId: null,
        createdAt: "2021-01-29T00:00:00Z",
        interactionSteps: [
          {
            ...emptyStep,
            id: `new6432`,
            parentInteractionId: "new5432",
            createdAt: "2021-01-29T00:00:00Z"
          }
        ]
      };

      await persistInteractionStepTree(campaign.id, stepToPersist, {
        is_started: campaign.is_started
      });

      const { rows: liveSteps } = await client.query<InteractionStepRecord>(
        `select * from interaction_step where is_deleted = false and campaign_id = $1`,
        [campaign.id]
      );

      expect(liveSteps).toHaveLength(2);
      const rootStep = liveSteps.find(
        (step) => step.parent_interaction_id === null
      );
      expect(rootStep).not.toBeUndefined();
      expect(rootStep!.id).not.toEqual(oldRootStep.id);

      const childStep = liveSteps.find(
        (step) => step.parent_interaction_id !== null
      );
      expect(childStep).not.toBeUndefined();
      expect(childStep!.id).not.toEqual(oldChildStep.id);
      expect(childStep!.parent_interaction_id).toEqual(rootStep!.id);
    });
  });

  test("ignores deleted steps in tree", async () => {
    await withClient(pool, async (client) => {
      const { campaign } = await createCompleteCampaign(client, {
        campaign: { isStarted: false }
      });

      const stepToPersist: InteractionStepWithChildren = {
        ...emptyStep,
        id: "new5432",
        parentInteractionId: null,
        createdAt: "2021-01-29T00:00:00Z",
        interactionSteps: [
          {
            ...emptyStep,
            id: `new6432`,
            parentInteractionId: "new5432",
            createdAt: "2021-01-29T00:00:00Z",
            isDeleted: true
          }
        ]
      };

      await persistInteractionStepTree(campaign.id, stepToPersist, {
        is_started: campaign.is_started
      });

      const { rows: liveSteps } = await client.query<InteractionStepRecord>(
        `select * from interaction_step where campaign_id = $1`,
        [campaign.id]
      );

      expect(liveSteps).toHaveLength(1);
      expect(liveSteps[0].parent_interaction_id).toBeNull();
    });
  });

  test("soft deletes steps that have question response referenced", async () => {
    await withClient(pool, async (client) => {
      const { campaign } = await createCompleteCampaign(client, {
        campaign: { isStarted: true }
      });
      const rootStep = await createInteractionStep(client, {
        campaignId: campaign.id
      });
      const childStep = await createInteractionStep(client, {
        campaignId: campaign.id,
        parentInteractionId: rootStep.id
      });
      const newContact = await createCampaignContact(client, {
        campaignId: campaign.id
      });
      await createQuestionResponse(client, {
        value: childStep.answer_option,
        campaignContactId: newContact.id,
        interactionStepId: childStep.id
      });

      const stepToPersist: InteractionStepWithChildren = {
        ...emptyStep,
        id: `${rootStep.id}`,
        parentInteractionId: null,
        createdAt: "2021-01-29T00:00:00Z",
        interactionSteps: [
          {
            ...emptyStep,
            id: `${childStep.id}`,
            parentInteractionId: `${rootStep.id}`,
            createdAt: "2021-01-29T00:00:00Z",
            isDeleted: true
          }
        ]
      };

      await persistInteractionStepTree(campaign.id, stepToPersist, {
        is_started: campaign.is_started
      });

      const { rows: liveSteps } = await client.query<InteractionStepRecord>(
        `select * from interaction_step where campaign_id = $1`,
        [campaign.id]
      );

      expect(liveSteps).toHaveLength(2);
      const rootStepRecord = liveSteps.find(
        (step) => step.parent_interaction_id === null
      );
      expect(rootStepRecord).not.toBeUndefined();
      expect(rootStepRecord!.id).toEqual(rootStep.id);
      expect(rootStepRecord!.is_deleted).toBe(false);

      const childStepRecord = liveSteps.find(
        (step) => step.parent_interaction_id !== null
      );
      expect(childStepRecord).not.toBeUndefined();
      expect(childStepRecord!.id).toEqual(childStep.id);
      expect(childStepRecord!.is_deleted).toBe(true);
    });
  });
});
