export const nodeHasQueryPath = (node, path) => {
  const pathComponents = path.split(".");
  const searchName = pathComponents.shift();

  if (node.name.value !== searchName) return false;

  if (pathComponents.length === 0) return true;

  // Can we traverse further?
  if (!node.selectionSet.selections) return false;
  const { selections } = node.selectionSet;
  const nextNode = selections.find((s) => s.name.value === pathComponents[0]);
  if (!nextNode) return false;

  const nextPath = pathComponents.join(".");
  return nodeHasQueryPath(nextNode, nextPath);
};

export const infoHasQueryPath = (info, path, fieldIndex = 0) =>
  nodeHasQueryPath(info.fieldNodes[fieldIndex], path);
