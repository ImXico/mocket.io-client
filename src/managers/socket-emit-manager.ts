import { SocketEventTarget } from "../socket-event-target";
import { isCustomEvent } from "../util";
import { SocketAttributes } from "./socket-attribute-manager.types";
import {
  genUniqueAckId,
  isReservedEventFromServer,
  ReservedServerEvent,
} from "./socket-emit-manager.util";

export class SocketEmitManager {
  constructor(
    private clientEventTarget: SocketEventTarget,
    private serverEventTarget: SocketEventTarget,
    private clientSocketAttributes: SocketAttributes
  ) {}

  public emitFromClient = <T extends string = string>(
    eventKey: T,
    args?: any[]
  ) => {
    this.serverEventTarget.dispatchEvent(
      new CustomEvent(eventKey, {
        detail: args,
      })
    );

    return this.clientEventTarget;
  };

  public emitFromClientWithAck = <T extends string = string>(
    eventKey: T,
    ...args: any[]
  ) => {
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
        })
      );
    });
  };

  // 'send' is a shorthand for emitting a 'message' event
  public send = (data: any, callback?: (response: any) => void) => {
    if (callback) {
      return this.emitFromClientWithAck("message", data).then(callback);
    }

    return this.emitFromClient("message", [data]);
  };

  private emitReservedFromServer = (eventKey: ReservedServerEvent) => {
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
  };

  private emitCustomFromServer = <T extends string = string>(
    eventKey: T,
    args?: any[]
  ) => {
    console.log("MOCK EMIT CUSTOM FROM SERVER", eventKey, args);
    this.clientEventTarget.dispatchEvent(
      new CustomEvent(eventKey, {
        detail: args,
      })
    );
  };

  public emitFromServer = <T extends string = string>(
    eventKey: T,
    args?: any[]
  ) => {
    return isReservedEventFromServer(eventKey)
      ? this.emitReservedFromServer(eventKey)
      : this.emitCustomFromServer(eventKey, args);
  };

  public acknowledgeClientEvent = (ackId: string, response: any) => {
    // Acknowledge on the server, which will trigger the resolve of
    // the promise on the client side (in `mockEmitFromClientWithAck`).
    this.serverEventTarget.dispatchEvent(
      new CustomEvent(ackId, {
        detail: response,
      })
    );
  };
}
