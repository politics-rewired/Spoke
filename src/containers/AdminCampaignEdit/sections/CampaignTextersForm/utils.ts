import { Texter } from "./types";

export const assignTexterContacts = (
  editedTexter: Texter,
  contactsToAssign: number,
  contactsCount: number
): Texter => {
  let messagedCount = 0;
  if (editedTexter.assignment.needsMessageCount) {
    messagedCount =
      editedTexter.assignment.contactsCount -
      editedTexter.assignment.needsMessageCount;
  }

  let convertedNeedsMessageCount = contactsToAssign;

  const convertedMaxContacts = editedTexter.assignment.maxContacts || null;

  if (Number.isNaN(convertedNeedsMessageCount)) {
    convertedNeedsMessageCount = 0;
  }
  if (convertedNeedsMessageCount + messagedCount > contactsCount) {
    convertedNeedsMessageCount = contactsCount - messagedCount;
  }

  if (convertedNeedsMessageCount < 0) {
    convertedNeedsMessageCount = 0;
  }

  return {
    ...editedTexter,
    assignment: {
      ...editedTexter.assignment,
      contactsCount: convertedNeedsMessageCount + messagedCount,
      messagedCount,
      needsMessageCount: convertedNeedsMessageCount,
      maxContacts: convertedMaxContacts || contactsCount
    }
  };
};

export const handleExtraTexterCapacity = (
  texter: Texter,
  extraTexterCapacity: number
) => {
  // If extraTexterCapacity > 0, reduce the user's input to the number of contacts available
  // for assignment
  const { needsMessageCount, contactsCount } = texter.assignment;
  const correctedTexter = {
    ...texter,
    assignment: {
      ...texter.assignment,
      needsMessageCount: needsMessageCount - extraTexterCapacity,
      contactsCount: contactsCount - extraTexterCapacity
    }
  };
  return correctedTexter;
};
