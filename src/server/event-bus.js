import events from "events";

export const EventType = Object.freeze({
  AssignmentCreated: "assignment.created",
  MessageReceived: "message.received"
});

export const eventBus = new events.EventEmitter();
