/* eslint-disable import/prefer-default-export */
import type { FieldNode, SelectionNode } from "graphql";

export const selectionsByType = (node: FieldNode) => {
  const selections = node.selectionSet?.selections ?? [];
  return selections.reduce<{
    simple: SelectionNode[];
    complex: SelectionNode[];
  }>(
    (acc, selection) => {
      if ((selection as FieldNode).selectionSet !== undefined) {
        acc.complex.push(selection);
      } else {
        acc.simple.push(selection);
      }
      return acc;
    },
    { simple: [], complex: [] }
  );
};
