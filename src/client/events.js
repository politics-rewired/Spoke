import EventEmitter from "events";

export const EventTypes = Object.freeze({
  NewSpokeVersionAvailble: "NewSpokeVersionAvailble"
});

export const eventBus = new EventEmitter();
