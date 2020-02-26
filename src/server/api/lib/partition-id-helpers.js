const DELIMITER = "-";

export const joinIdentifier = (campaignId, id) => {
  return [campaignId, id].join("-");
};

export const parseIdentifier = identifier => {
  if (typeof identifier === "string") {
    const split = identifier.split(DELIMITER);
    if (split.length === 1) {
      return [undefined, identifier];
    } else {
      return [parseInt(split[0]), parseInt(split[1])];
    }
  }

  return [undefined, identifier];
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
      obj[key] !== undefined
        ? Object.assign(acc, { [key]: parseInt(obj[key]) })
        : acc,
    {}
  );
};
