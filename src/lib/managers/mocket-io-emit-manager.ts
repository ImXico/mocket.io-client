import { MocketioEventTarget } from "../target/mocket-io-event-target";
import {
  handleCustomEventWithAck,
  handleCustomEventWithNoAck,
  isCustomEvent,
} from "../util";
import { SocketAttributes } from "./mocket-io-attribute-manager";

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
 * Formats the payload for an event based on the number of arguments.
 * If there are multiple arguments, marks them for spreading with _spreadArgs flag.
 * This function should *always* be used to format the args in the detail of a CustomEvent before dispatching.
 * @param args - The arguments to format
 * @returns The formatted payload
 */
const getDetailPayloadForEventEmission = (args: any[]): any => {
  if (args.length === 0) {
    return undefined;
  } else if (args.length === 1) {
    // Single argument - pass as is (even if it's an array)
    return args[0];
  } else {
    // Multiple arguments - wrap in special structure to indicate spreading
    return { _spreadArgs: true, args: args };
  }
};

const getAckEventKey = (eventKey: string): string => {
  return `${eventKey}:ack`;
};

/**
 * Generates a unique acknowledgment ID.
 * @returns A unique acknowledgment ID string.
 */
const genUniqueAckId = (): string => {
  return `ack_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
};

/**
 * MocketioEmitManager is responsible for managing the emission of events between
 * the client and server sides of a socket connection. It provides methods to emit
 * events from the client to the server, as well as from the server to the client.
 * It also handles acknowledgment of events.
 * @internal
 */
export class MocketioEmitManager {
  constructor(
    private clientEventTarget: MocketioEventTarget,
    private serverEventTarget: MocketioEventTarget,
    private clientSocketAttributes: SocketAttributes,
  ) {}

  public emitFromClient = <
    EventType extends string = string,
    ArgsType extends any[] = any[],
  >(
    eventKey: EventType,
    ...args: ArgsType
  ): MocketioEventTarget => {
    const lastArg = args.length > 0 ? args[args.length - 1] : undefined;
    const hasCallback = typeof lastArg === "function";

    // Regular emit without acknowledgment
    if (!hasCallback) {
      const formattedArgs = getDetailPayloadForEventEmission(args);

      this.serverEventTarget.dispatchEvent(
        new CustomEvent(eventKey, {
          detail: formattedArgs,
        }),
      );

      return this.clientEventTarget;
    }

    const callback = args.pop();
    const ackId = genUniqueAckId();
    const ackEventKey = getAckEventKey(eventKey);

    // Set up a one-time event listener for the acknowledgment response
    const ackListener = (event: Event) => {
      if (isCustomEvent(event) && event.detail?.ackId === ackId) {
        handleCustomEventWithAck(event, callback);
        // Remove the listener after it's been called
        this.clientEventTarget.removeEventListener(ackEventKey, ackListener);
      }
    };

    // Setup a listener for the acknowledgment response
    this.clientEventTarget.addEventListener(ackEventKey, ackListener);

    // Format the arguments for acknowledgment
    const formattedArgs = getDetailPayloadForEventEmission(args);

    this.serverEventTarget.dispatchEvent(
      new CustomEvent(ackEventKey, {
        detail: {
          ackId,
          args: formattedArgs,
        },
      }),
    );

    return this.clientEventTarget;
  };

  public emitFromClientWithAck = <
    EventType extends string = string,
    ArgsType extends any[] = any[],
  >(
    eventKey: EventType,
    ...args: ArgsType
  ): Promise<any> => {
    return new Promise<any>((resolve) => {
      const lastArg = args.length > 0 ? args[args.length - 1] : undefined;
      const hasCallback = typeof lastArg === "function";
      const userCallback = hasCallback ? (args.pop() as Function) : undefined;

      const promiseCallback = (...responseArgs: any[]) => {
        resolve(responseArgs.length === 1 ? responseArgs[0] : responseArgs);

        if (userCallback) {
          userCallback(...responseArgs);
        }
      };

      this.emitFromClient(eventKey, ...args, promiseCallback);
    });
  };

  /**
   * 'send' is a shorthand for emitting a 'message' event.
   * @param args - The arguments to send with the message.
   * @returns MocketioEventTarget - The target to which the event is sent.
   */
  public send = <ArgsType extends any[] = any[]>(
    ...args: any[]
  ): MocketioEventTarget => {
    const lastArg = args.length > 0 ? args[args.length - 1] : undefined;
    const hasCallback = typeof lastArg === "function";

    if (hasCallback) {
      const callback = args.pop();
      return this.emitFromClient("message", ...args, callback);
    }

    return this.emitFromClient("message", ...args);
  };

  private emitReservedFromServer = (
    eventKey: ReservedServerEvent,
  ): MocketioEventTarget => {
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

  private emitCustomFromServer = <
    EventType extends string = string,
    ArgsType extends any[] = any[],
  >(
    eventKey: EventType,
    args: ArgsType,
  ): MocketioEventTarget => {
    const formattedArgs = getDetailPayloadForEventEmission(args);

    this.clientEventTarget.dispatchEvent(
      new CustomEvent(eventKey, {
        detail: formattedArgs,
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
  ): MocketioEventTarget => {
    return isReservedEventFromServer(eventKey)
      ? this.emitReservedFromServer(eventKey)
      : this.emitCustomFromServer(eventKey, args);
  };

  public serverOn = <EventType extends string = string>(
    eventKey: EventType,
    handler: (...args: any[]) => any,
  ): MocketioEventTarget => {
    const ackEventKey = getAckEventKey(eventKey);

    const regularEventListener = (event: Event) => {
      if (isCustomEvent(event)) {
        return handleCustomEventWithNoAck(event, handler);
      }
    };

    const ackEventListener = (event: Event) => {
      if (isCustomEvent(event)) {
        const ackId = event.detail.ackId;

        let args: any[] = [];

        // Check if the args are in the special structure with _spreadArgs
        if (
          event.detail.args &&
          typeof event.detail.args === "object" &&
          event.detail.args._spreadArgs
        ) {
          // Multiple arguments that were wrapped with _spreadArgs
          // We'll be spreading these in the handler call, so no need to spread them here
          args = event.detail.args.args;
        } else if (event.detail.args === undefined) {
          // No arguments case
          args = [];
        } else if (Array.isArray(event.detail.args)) {
          // Single argument that happens to be an array - keep it as an array, but nested
          // within another array, as we'll always need to spread int he handler call below
          args = [event.detail.args];
        } else {
          // Single non-array argument
          // Again, keeping it an array because we'll be spreading it in the handler call below
          args = [event.detail.args];
        }

        handler(...args, (...callbackArgs: any[]) => {
          // Format the callback arguments for sending back
          const formattedCallbackArgs =
            getDetailPayloadForEventEmission(callbackArgs);

          this.clientEventTarget.dispatchEvent(
            new CustomEvent(ackEventKey, {
              detail: {
                ackId,
                args: formattedCallbackArgs,
              },
            }),
          );
        });
      }
    };

    // Set up listeners for both regular events and those with ack
    this.serverEventTarget.addEventListener(eventKey, regularEventListener);
    this.serverEventTarget.addEventListener(ackEventKey, ackEventListener);

    return this.serverEventTarget;
  };
}
