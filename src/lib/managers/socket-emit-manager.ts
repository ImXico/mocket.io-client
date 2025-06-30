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

const getDetailPayloadForEvent = (args: any[]): any => {
  if (args.length === 0) {
    return undefined;
  }

  return args.length === 1 ? args[0] : args;
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
    console.log("@emitFromClient");
    const lastArg = args.length > 0 ? args[args.length - 1] : undefined;
    const hasCallback = typeof lastArg === "function";

    // Regular emit without acknowledgment
    if (!hasCallback) {
      console.log("@emitFromClient ---- regular ");
      this.serverEventTarget.dispatchEvent(
        new CustomEvent(eventKey, {
          detail: getDetailPayloadForEvent(args),
        }),
      );

      return this.clientEventTarget;
    }

    console.log("1 @emitFromClient ---- with ack");

    const callback = args.pop();
    const ackId = genUniqueAckId();
    const ackEventKey = getAckEventKey(eventKey);

    // Set up a one-time event listener for the acknowledgment response
    const ackListener = (event: Event) => {
      if (
        isCustomEvent(event) &&
        event.detail &&
        event.detail.ackId === ackId
      ) {
        console.log("5.5 event.detail", event.detail);
        console.log(" ---->", event.detail.args);
        if (Array.isArray(event.detail.args)) {
          console.log("6 Calling callback with array:", event.detail.args);

          callback(...event.detail.args);
          // but why do we even need to call the callback here?
        } else {
          console.log(
            "6 Calling callback with single value:",
            event.detail.args,
          );

          // Fallback for single argument or non-array case
          callback(event.detail.args);
        }

        // Remove the listener after it's been called
        this.clientEventTarget.removeEventListener(ackEventKey, ackListener);
      }
    };

    // Setup a listener for the acknowledgment response
    this.clientEventTarget.addEventListener(ackEventKey, ackListener);

    console.log("2 args are: ", args);
    this.serverEventTarget.dispatchEvent(
      new CustomEvent(ackEventKey, {
        detail: {
          ackId,
          args,
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
    console.log("@emitFromClientWithAck");
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

  // 'send' is a shorthand for emitting a 'message' event
  public send = <ArgsType extends any[] = any[]>(
    ...args: any[]
  ): SocketEventTarget => {
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

  private emitCustomFromServer = <
    EventType extends string = string,
    ArgsType extends any[] = any[],
  >(
    eventKey: EventType,
    ...args: ArgsType
  ): SocketEventTarget => {
    const detail = getDetailPayloadForEvent(args);

    this.clientEventTarget.dispatchEvent(
      new CustomEvent(eventKey, {
        detail,
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
      : this.emitCustomFromServer(eventKey, ...args);
  };

  public serverOn = <EventType extends string = string>(
    eventKey: EventType,
    handler: (...args: any[]) => any,
  ): SocketEventTarget => {
    const ackEventKey = getAckEventKey(eventKey);

    const regularEventListener = (event: Event) => {
      if (isCustomEvent(event)) {
        const isArray = Array.isArray(event.detail);
        console.log(event.detail);
        const args = isArray ? event.detail : [event.detail];
        handler(...args);
      }
    };

    const ackEventListener = (event: Event) => {
      console.log("3 @ mock server on ---");
      if (isCustomEvent(event)) {
        const ackId = event.detail.ackId;
        const args = Array.isArray(event.detail.args)
          ? event.detail.args
          : [event.detail.args];

        // Call the handler with args and callback
        console.log("4 ????", ...args);

        // ...args is a bunch of args
        // the after the comma is the very last arg — a function that takes some param(s)
        // here callbackArgs would be e.g. callbac(true) --> callbackArgs = true
        handler(...args, (...callbackArgs: any[]) => {
          console.log("5 callback args: ", ...callbackArgs);
          console.log("5.1 Server sending ack with:", ackId, callbackArgs);
          this.clientEventTarget.dispatchEvent(
            new CustomEvent(ackEventKey, {
              detail: {
                ackId,
                args: callbackArgs,
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
