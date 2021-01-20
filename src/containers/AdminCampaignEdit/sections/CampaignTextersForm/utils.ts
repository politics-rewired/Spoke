import { Texter } from ".";

// eslint-disable-next-line import/prefer-default-export
export const assignTexterContacts = (
  editedTexter: Texter,
  contactsToAssign: string,
  contactsCount: number
) => {
  let messagedCount = 0;
  if (editedTexter.assignment.needsMessageCount) {
    messagedCount =
      editedTexter.assignment.contactsCount -
      editedTexter.assignment.needsMessageCount;
  }

  let convertedNeedsMessageCount = parseInt(contactsToAssign, 10);

  const convertedMaxContacts = editedTexter.assignment.maxContacts
    ? parseInt(editedTexter.assignment.maxContacts, 10)
    : null;

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
  // 2. If extraTexterCapacity > 0, reduce the user's input to the number of contacts available
  // for assignment
  let { needsMessageCount, contactsCount } = texter.assignment;
  const correctedTexter = {
    ...texter,
    assignment: {
      ...texter.assignment,
      needsMessageCount: needsMessageCount -= extraTexterCapacity,
      contactsCount: contactsCount -= extraTexterCapacity
    }
  };
  return correctedTexter;
};
