const DELIMITER = "-";

export const parseIdentifier = identifier => {
  const split = identifier.split(DELIMITER);
  if (split.length === 1) {
    return [undefined, identifier];
  } else {
    return [split[0], split[1]];
  }
};

export const getWhereClausesFromId = (identifier, idFieldName) => {
  const split = identifier.split(DELIMITER);
  if (split.length === 1) {
    return { [idFieldName | "id"]: identifier };
  }
  if (split.length === 2) {
    return { campaign_id: split[0], [idFieldName | "id"]: split[1] };
  }
};

export const filterUndefinedObject = obj => {
  return Object.keys(obj).reduce(
    (acc, key) =>
      obj[key] !== undefined ? Object.assign(acc, { [key]: obj[key] }) : acc,
    {}
  );
};

// export const getJoinFunction = (identifier)
