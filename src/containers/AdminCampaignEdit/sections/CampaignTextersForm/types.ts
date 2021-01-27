interface TexterAssignment {
  contactsCount: number;
  messagedCount: number;
  needsMessageCount: number;
  maxContacts: number;
}

export interface Texter {
  id: string;
  firstName: string;
  assignment: TexterAssignment;
}
