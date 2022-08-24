import EventEmitter from "events";

export enum EventTypes {
  NewSpokeVersionAvailble = "NewSpokeVersionAvailble",
  GraphQLServerError = "GraphQLServerError"
}

export const eventBus = new EventEmitter();
