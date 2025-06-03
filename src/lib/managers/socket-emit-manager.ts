import { SocketEventTarget } from "../target/socket-event-target";
import { isCustomEvent } from "../util";
import { SocketAttributes } from "./socket-attribute-manager";

/**
 * Reserved Socket.IO event names.
 * These events are reserved by Socket.IO and should not be used as custom event names.
 * Using these names for custom events may lead to unexpected behavior.
 * @see https://socket.io/docs/v4/server-api/#Socket
 */
const RESERVED_SERVER_EVENTS = {
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
type ReservedServerEvent =
  (typeof RESERVED_SERVER_EVENTS)[keyof typeof RESERVED_SERVER_EVENTS];

/**
 * Type guard to check if a given event key is a reserved event from the server.
 * @param eventKey - The event key to check.
 * @returns True if the event key is a reserved event from the server, false otherwise.
 */
const isReservedEventFromServer = (
  eventKey: string,
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
const genUniqueAckId = (): string => {
  return `ack_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
};

/**
 * SocketEmitManager is responsible for managing the emission of events between
 * the client and server sides of a socket connection. It provides methods to emit
 * events from the client to the server, as well as from the server to the client.
 * It also handles acknowledgment of events.
 * @internal
 */
export class SocketEmitManager {
  constructor(
    private clientEventTarget: SocketEventTarget,
    private serverEventTarget: SocketEventTarget,
    private clientSocketAttributes: SocketAttributes,
  ) {}

  public emitFromClient = <
    EventType extends string = string,
    ArgsType extends any[] = any[],
  >(
    eventKey: EventType,
    ...args: ArgsType
  ): SocketEventTarget => {
    // Check if the last argument is a function (acknowledgment callback)
    const lastArg = args.length > 0 ? args[args.length - 1] : undefined;
    const hasAck = typeof lastArg === "function";

    if (hasAck) {
      // If has callback, use the promise-based method internally
      const callback = args.pop();
      this.emitFromClientWithAck(eventKey, ...args)
        .then((response) => callback(response))
        .catch((error) => console.error("Acknowledgment error:", error));
    } else {
      // Regular emit without acknowledgment
      this.serverEventTarget.dispatchEvent(
        new CustomEvent(eventKey, {
          detail: args.length > 0 ? args : undefined,
        }),
      );
    }

    return this.clientEventTarget;
  };

  public emitFromClientWithAck = <
    EventType extends string = string,
    ArgsType extends any[] = any[],
  >(
    eventKey: EventType,
    ...args: ArgsType
  ): Promise<any> => {
    // Return a promise that will be resolved when the server sends an acknowledgment
    return new Promise<any>((resolve) => {
      const ackId = genUniqueAckId();

      // Set up a one-time event listener for the acknowledgment response.
      const ackListener = (event: Event) => {
        if (isCustomEvent(event)) {
          resolve(event.detail);
          this.serverEventTarget.removeEventListener(ackId, ackListener);
        }
      };

      // Setup a listener for the acknowledgment response.
      this.serverEventTarget.addEventListener(ackId, ackListener);

      // Emit the event with the additional ackId parameter.
      this.serverEventTarget.dispatchEvent(
        new CustomEvent(eventKey, {
          detail: {
            args,
            ackId,
          },
        }),
      );
    });
  };

  // 'send' is a shorthand for emitting a 'message' event
  public send = <ArgsType extends any[] = any[]>(
    ...args: any[]
  ): SocketEventTarget => {
    const lastArg = args.length > 1 ? args[args.length - 1] : undefined;
    const hasAck = typeof lastArg === "function";

    if (hasAck) {
      const callback = args.pop();
      return this.emitFromClient("message", ...args, callback);
    }

    return this.emitFromClient("message", ...args);
  };

  private emitReservedFromServer = (
    eventKey: ReservedServerEvent,
  ): SocketEventTarget => {
    if (eventKey === "connect") {
      this.clientSocketAttributes.connected = true;
      this.clientSocketAttributes.disconnected = false;
      // In socket.io, the server assigns the ID and sends it with the handshake
      // Simulating server-assigned ID
      this.clientSocketAttributes.id = String(Date.now());
    } else if (eventKey === "connect_error") {
      // Socket.IO keeps the connection state as is during connect_error
      // It just emits the event for the client to handle
    } else if (eventKey === "disconnect") {
      this.clientSocketAttributes.connected = false;
      this.clientSocketAttributes.disconnected = true;
      // Keep the ID until further reconnection attempt
    }

    this.clientEventTarget.dispatchEvent(new CustomEvent(eventKey));

    return this.serverEventTarget;
  };

  private emitCustomFromServer = <T extends string = string>(
    eventKey: T,
    args?: any[],
  ): SocketEventTarget => {
    this.clientEventTarget.dispatchEvent(
      new CustomEvent(eventKey, {
        detail: args,
      }),
    );

    return this.serverEventTarget;
  };

  public emitFromServer = <
    EventType extends string = string,
    ArgsType extends any[] = any[],
  >(
    eventKey: EventType,
    ...args: ArgsType
  ): SocketEventTarget => {
    return isReservedEventFromServer(eventKey)
      ? this.emitReservedFromServer(eventKey)
      : this.emitCustomFromServer(eventKey, args);
  };

  public acknowledgeClientEvent = (
    ackId: string,
    response: any,
  ): SocketEventTarget => {
    // Acknowledge on the server, which will trigger the resolve of
    // the promise on the client side (in `mockEmitFromClientWithAck`).
    this.serverEventTarget.dispatchEvent(
      new CustomEvent(ackId, {
        detail: response,
      }),
    );

    return this.serverEventTarget;
  };
}
