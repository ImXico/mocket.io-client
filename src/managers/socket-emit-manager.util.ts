/**
 * Reserved Socket.IO event names.
 * These events are reserved by Socket.IO and should not be used as custom event names.
 * Using these names for custom events may lead to unexpected behavior.
 * @see https://socket.io/docs/v4/server-api/#Socket
 */
export const RESERVED_SERVER_EVENTS = {
  connect: "connect",
  connect_error: "connect_error",
  disconnect: "disconnect",
} as const;

/**
 * Type representing the reserved Socket.IO event names.
 * This type is derived from the `RESERVED_SERVER_EVENTS` object.
 * It includes the keys of the object as string literals.
 * @see https://socket.io/docs/v4/server-api/#Socket
 */
export type ReservedServerEvent =
  (typeof RESERVED_SERVER_EVENTS)[keyof typeof RESERVED_SERVER_EVENTS];

/**
 * Type guard to check if a given event key is a reserved event from the server.
 * @param eventKey - The event key to check.
 * @returns True if the event key is a reserved event from the server, false otherwise.
 */
export const isReservedEventFromServer = (
  eventKey: string
): eventKey is ReservedServerEvent => {
  return (
    eventKey === RESERVED_SERVER_EVENTS.connect ||
    eventKey === RESERVED_SERVER_EVENTS.connect_error ||
    eventKey === RESERVED_SERVER_EVENTS.disconnect
  );
};

/**
 * Generates a unique acknowledgment ID.
 * @returns A unique acknowledgment ID string.
 */
export const genUniqueAckId = () => {
  return `ack_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
};
