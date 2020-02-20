export const getWhereClausesFromId = (identifier, idFieldName) => {
  const split = identifier.split("|");
  if (split.length === 1) {
    return { [idFieldName | "id"]: identifier };
  }
  if (split.length === 2) {
    return { campaign_id: split[0], [idFieldName | "id"]: split[1] };
  }
};

// export const getJoinFunction = (identifier)
