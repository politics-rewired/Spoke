import { Pool, PoolClient } from "pg";

import {
  createCompleteCampaign,
  createInteractionStep
} from "../../../../__test__/testbed-preparation/core";
import { InteractionStepWithChildren } from "../../../api/interaction-step";
import { config } from "../../../config";
import { InteractionStepRecord } from "../types";
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
  let client: PoolClient;

  beforeAll(async () => {
    pool = new Pool({ connectionString: config.TEST_DATABASE_URL });
    client = await pool.connect();
  });

  afterAll(async () => {
    if (client) client.release();
    if (pool) await pool.end();
  });

  test("adds new interaction steps", async () => {
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

  test("removes deleted interaction steps", async () => {
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

    expect(deletedStep).toHaveProperty("is_deleted");
    expect(deletedStep.is_deleted).toBe(true);
  });

  test("updates modified interaction steps", async () => {
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
