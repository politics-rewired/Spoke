import filter from "lodash/fp/filter";
import flow from "lodash/fp/flow";
import fromPairs from "lodash/fp/fromPairs";
import map from "lodash/fp/map";
import reverse from "lodash/fp/reverse";
import sortBy from "lodash/fp/sortBy";

import { DateTime } from "./datetime";

export const sortByCreatedAt = (is) => {
  const asDate = DateTime.fromISO(is.createdAt);
  return asDate.isValid ? asDate : null;
};

// Sort by newest first
export const sortByNewest = flow(sortBy(sortByCreatedAt), reverse);

export function findParent(interactionStep, allInteractionSteps, isModel) {
  let parent = null;
  allInteractionSteps.forEach((step) => {
    if (isModel) {
      if (step.id === interactionStep.parent_interaction_id) {
        parent = {
          ...step,
          answerLink: interactionStep.answer_option
        };
      }
    } else if (isModel || (step.question && step.question.answerOptions)) {
      step.question.answerOptions.forEach((answer) => {
        if (
          answer.nextInteractionStep &&
          answer.nextInteractionStep.id === interactionStep.id
        ) {
          parent = {
            ...step,
            answerLink: answer.value
          };
        }
      });
    }
  });
  return parent;
}

export function getInteractionPath(
  interactionStep,
  allInteractionSteps,
  isModel
) {
  const path = [];
  let parent = findParent(interactionStep, allInteractionSteps, isModel);
  while (parent !== null) {
    path.unshift(parent);
    parent = findParent(parent, allInteractionSteps, isModel);
  }
  return path;
}

export function interactionStepForId(id, interactionSteps) {
  let interactionStep = null;
  interactionSteps.forEach((step) => {
    if (step.id === id) {
      interactionStep = step;
    }
  });
  return interactionStep;
}

export function getChildren(interactionStep, allInteractionSteps, isModel) {
  const children = [];
  allInteractionSteps.forEach((step) => {
    const path = getInteractionPath(step, allInteractionSteps, isModel);
    path.forEach((pathElement) => {
      if (pathElement.id === interactionStep.id) {
        children.push(step);
      }
    });
  });
  return children;
}

export function getInteractionTree(allInteractionSteps, isModel) {
  const pathLengthHash = {};
  allInteractionSteps.forEach((step) => {
    const path = getInteractionPath(step, allInteractionSteps, isModel);
    pathLengthHash[path.length] = pathLengthHash[path.length] || [];
    pathLengthHash[path.length].push({ interactionStep: step, path });
  });
  return pathLengthHash;
}

export function getTopMostParent(interactionSteps, isModel) {
  return sortByNewest(interactionSteps).find((step) =>
    isModel
      ? step.parent_interaction_id === null
      : step.parentInteractionId === null
  );
}

export function makeTree(interactionSteps, id = null, indexed = null) {
  const indexedById =
    indexed ||
    flow(
      map((is) => [is.id, is]),
      fromPairs
    )(interactionSteps);

  const root = id ? indexedById[id] : getTopMostParent(interactionSteps, false);

  return {
    ...root,
    interactionSteps: flow(
      filter((is) => is.parentInteractionId === root.id),
      sortByNewest,
      map((c) => makeTree(interactionSteps, c.id, indexedById))
    )(interactionSteps)
  };
}
