import type { InteractionStep } from "../api/interaction-step";
import { makeTree } from "./interaction-step-helpers";

const baseEmptyStep = {
  questionText: "",
  answerActions: "",
  scriptOptions: [""],
  isDeleted: false,
  answerOption: "",
  createdAt: "2021-01-26T00:00:00Z"
};

describe("makeTree", () => {
  test("handles empty interaction steps argument", () => {
    const steps: InteractionStep[] = [];
    const tree = makeTree(steps);
    expect(tree).toEqual({ interactionSteps: [] });
  });

  test("handles building a basic tree", () => {
    const rootStep: InteractionStep = {
      ...baseEmptyStep,
      id: "1",
      parentInteractionId: null,
      createdAt: "2021-01-26T00:00:01Z"
    };
    const childStepA: InteractionStep = {
      ...baseEmptyStep,
      id: "2",
      parentInteractionId: "1",
      createdAt: "2021-01-26T00:00:02Z"
    };
    const childStepB: InteractionStep = {
      ...baseEmptyStep,
      id: "3",
      parentInteractionId: "1",
      createdAt: "2021-01-26T00:00:03Z"
    };
    const childStepAA: InteractionStep = {
      ...baseEmptyStep,
      id: "4",
      parentInteractionId: "2",
      createdAt: "2021-01-26T00:00:04Z"
    };
    const steps: InteractionStep[] = [
      rootStep,
      childStepA,
      childStepB,
      childStepAA
    ];

    const tree = makeTree(steps);

    expect(tree).toEqual({
      ...rootStep,
      interactionSteps: [
        { ...childStepB, interactionSteps: [] },
        {
          ...childStepA,
          interactionSteps: [{ ...childStepAA, interactionSteps: [] }]
        }
      ]
    });
  });

  test("handles building a tree with deleted steps", () => {
    const rootStep: InteractionStep = {
      ...baseEmptyStep,
      id: "1",
      parentInteractionId: null,
      createdAt: "2021-01-26T00:00:01Z"
    };
    const childStepA: InteractionStep = {
      ...baseEmptyStep,
      id: "2",
      parentInteractionId: "1",
      createdAt: "2021-01-26T00:00:02Z"
    };
    const childStepB: InteractionStep = {
      ...baseEmptyStep,
      id: "3",
      parentInteractionId: "1",
      isDeleted: true,
      createdAt: "2021-01-26T00:00:03Z"
    };
    const childStepAA: InteractionStep = {
      ...baseEmptyStep,
      id: "4",
      parentInteractionId: "2",
      createdAt: "2021-01-26T00:00:04Z"
    };
    const steps: InteractionStep[] = [
      rootStep,
      childStepA,
      childStepB,
      childStepAA
    ];

    const tree = makeTree(steps);

    expect(tree).toEqual({
      ...rootStep,
      interactionSteps: [
        { ...childStepB, interactionSteps: [] },
        {
          ...childStepA,
          interactionSteps: [{ ...childStepAA, interactionSteps: [] }]
        }
      ]
    });
  });

  test("handles building a tree when input array is unsorted", () => {
    const rootStep: InteractionStep = {
      ...baseEmptyStep,
      id: "1",
      parentInteractionId: null,
      createdAt: "2021-01-26T00:00:01Z"
    };
    const childStepA: InteractionStep = {
      ...baseEmptyStep,
      id: "2",
      parentInteractionId: "1",
      createdAt: "2021-01-26T00:00:02Z"
    };
    const childStepB: InteractionStep = {
      ...baseEmptyStep,
      id: "3",
      parentInteractionId: "1",
      createdAt: "2021-01-26T00:00:03Z"
    };
    const childStepC: InteractionStep = {
      ...baseEmptyStep,
      id: "4",
      parentInteractionId: "1",
      createdAt: "2021-01-26T00:00:04Z"
    };
    const steps: InteractionStep[] = [
      rootStep,
      childStepA,
      childStepC,
      childStepB
    ];

    const tree = makeTree(steps);

    expect(tree).toEqual({
      ...rootStep,
      interactionSteps: [
        { ...childStepC, interactionSteps: [] },
        { ...childStepB, interactionSteps: [] },
        { ...childStepA, interactionSteps: [] }
      ]
    });
  });

  test("handles building a tree when given multiple root interaction steps", () => {
    const rootStepA: InteractionStep = {
      ...baseEmptyStep,
      id: "1",
      parentInteractionId: null,
      createdAt: "2021-01-26T00:00:01Z"
    };
    const childStepAA: InteractionStep = {
      ...baseEmptyStep,
      id: "2",
      parentInteractionId: "1",
      createdAt: "2021-01-26T00:00:02Z"
    };
    const rootStepB: InteractionStep = {
      ...baseEmptyStep,
      id: "3",
      parentInteractionId: null,
      createdAt: "2021-01-26T00:00:03Z"
    };
    const childStepBA: InteractionStep = {
      ...baseEmptyStep,
      id: "4",
      parentInteractionId: "3",
      createdAt: "2021-01-26T00:00:04Z"
    };

    const steps: InteractionStep[] = [
      rootStepA,
      childStepAA,
      rootStepB,
      childStepBA
    ];
    const tree = makeTree(steps);

    expect(tree).toEqual({
      ...rootStepB,
      interactionSteps: [{ ...childStepBA, interactionSteps: [] }]
    });
  });
});
