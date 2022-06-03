/* eslint-disable max-classes-per-file */
import { GraphQLError } from "graphql";

export class SendTimeMessagingError extends GraphQLError {}

export class OutsideTextingHoursError extends SendTimeMessagingError {
  constructor() {
    super("Outside permitted texting time for this recipient");
  }
}

export class ContactOptedOutError extends SendTimeMessagingError {
  constructor() {
    super("Skipped sending because this contact was already opted out");
  }
}
