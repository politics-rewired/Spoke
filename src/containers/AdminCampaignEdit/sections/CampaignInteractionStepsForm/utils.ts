import type { GraphQLError } from "graphql";

export const isBlock = (text: string) => {
  try {
    const _newBlock = JSON.parse(text);
    return true;
  } catch (ex) {
    return false;
  }
};

export const hasDuplicateTriggerError = (
  errors: Error | readonly GraphQLError[]
) => {
  return (
    Array.isArray(errors) &&
    errors[0].message.includes(
      "Each interaction step can only have 1 child step assigned to any particular auto reply token"
    )
  );
};
