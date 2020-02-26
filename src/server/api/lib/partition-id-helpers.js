// Rather than pass around campaign id alongside contact, assignment, and message ids
// throughout the client applications, it's easier to concatenate and parse the ids
// on the server side.

const DELIMITER = "-";

export const joinIdentifier = (campaignId, id) => {
  return [campaignId, id].join("-");
};

export const parseIdentifier = identifier => {
  if (typeof identifier === "string") {
    const split = identifier.split(DELIMITER);
    if (split.length > 1) {
      return [parseInt(split[0]), parseInt(split[1])];
    }
  }

  return [undefined, identifier];
};
