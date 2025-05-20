/**
 * Checks if the given event is a CustomEvent.
 * @param event - The event to check
 * @returns true if the event is a CustomEvent, false otherwise
 */
export const isCustomEvent = (event: Event): event is CustomEvent => {
  return "detail" in event;
};
