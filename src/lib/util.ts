import { OuterHandler } from "./types";

/**
 * Checks if the given event is a CustomEvent.
 * @param event - The event to check
 * @returns true if the event is a CustomEvent, false otherwise
 */
export const isCustomEvent = (event: Event): event is CustomEvent => {
  if (!event || typeof event !== "object" || !(event instanceof Event)) {
    return false;
  }

  return "detail" in event;
};

/**
 * Handles a custom event with no acknowledgment.
 * This function is designed to handle custom events that do not require acknowledgment.
 * The difference between this and the `handleCustomEventWithNoAck` function is that this one
 * always calls the handler with the event type, even if the detail is undefined or null.
 * @param event - The custom event to handle
 * @param handler - The handler function to call with the event type and detail
 * @returns the result of the handler function
 */
export const handleCustomCatchAllEventWithNoAck = (
  event: CustomEvent,
  handler: OuterHandler,
) => {
  if (event.detail === undefined || event.detail === null) {
    return handler(event.type);
  }

  if (
    event.detail &&
    typeof event.detail === "object" &&
    event.detail._spreadArgs
  ) {
    return handler(event.type, ...event.detail.args);
  }

  return handler(event.type, event.detail);
};

/**
 * Handles a custom event with no acknowledgment.
 * This function is designed to handle custom events that do not require acknowledgment.
 * It extracts the detail from the event and passes it to the handler.
 * @param event - The custom event to handle
 * @param handler - The handler function to call with the event detail
 * @returns the result of the handler function
 */
export const handleCustomEventWithNoAck = (
  event: CustomEvent,
  handler: OuterHandler,
) => {
  if (event.detail === undefined || event.detail === null) {
    return handler();
  }

  if (
    event.detail &&
    typeof event.detail === "object" &&
    event.detail._spreadArgs
  ) {
    return handler(...event.detail.args);
  }

  return handler(event.detail);
};

/**
 * Handles a custom event with acknowledgment.
 * This function is designed to handle custom events that require acknowledgment.
 * @param event - The custom event to handle
 * @param handler - The handler function to call with the event detail
 * @returns the result of the handler function
 */
export const handleCustomEventWithAck = (
  event: CustomEvent,
  handler: OuterHandler,
) => {
  if (event.detail === undefined || event.detail === null) {
    return handler();
  }

  if (
    event.detail.args &&
    typeof event.detail.args === "object" &&
    event.detail.args._spreadArgs
  ) {
    return handler(...event.detail.args.args);
  }

  return handler(event.detail.args);
};
