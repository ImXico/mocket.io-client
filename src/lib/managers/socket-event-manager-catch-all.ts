import { CATCH_ALL_EVENT_TYPE } from "../constants";
import { SocketEventTarget } from "../target/socket-event-target";
import { InnerHandler, OuterHandler } from "../types";
import { isCustomEvent } from "../util";

type AnyEventHandlerRegistry = Map<
  OuterHandler,
  {
    innerHandler: InnerHandler;
    once: boolean;
  }
>;

export class SocketEventManagerCatchAll {
  constructor(
    private clientEventTarget: SocketEventTarget,
    private serverEventTarget: SocketEventTarget,
  ) {}

  private readonly anyIncomingHandlerRegistry: AnyEventHandlerRegistry =
    new Map();

  private readonly anyOutgoingHandlerRegistry: AnyEventHandlerRegistry =
    new Map();

  // Triggered when the client receives any event from the server
  // `onAny`: Adds listeners to the end of the queue (they execute last)
  public onAnyIncoming = (handler: OuterHandler): SocketEventTarget => {
    // Create an inner handler that adapts the event format
    const innerHandler = (event: Event) => {
      if (isCustomEvent(event)) {
        // Socket.io's onAny callback signature is (eventName, ...args)
        if (Array.isArray(event.detail)) {
          // If detail is an array, spread it as additional arguments after the event name
          return handler(event.type, ...event.detail);
        } else {
          // Otherwise pass event name and detail as separate arguments
          return handler(event.type, event.detail);
        }
      } else {
        // For non-custom events, just pass the event type
        return handler(event.type);
      }
    };

    // Store the handler mapping for later retrieval or removal
    this.anyIncomingHandlerRegistry.set(handler, {
      innerHandler,
      once: false,
    });

    // Register with the special "*" event type in CustomEventTarget
    this.clientEventTarget.addEventListener(CATCH_ALL_EVENT_TYPE, innerHandler);

    return this.clientEventTarget;
  };

  // Triggered when the client emits any event to the server
  public onAnyOutgoing = (handler: OuterHandler): SocketEventTarget => {
    // Create an inner handler that adapts the event format for outgoing events
    const innerHandler = (event: Event) => {
      if (isCustomEvent(event)) {
        // Socket.io's onAnyOutgoing callback signature is (eventName, ...args)
        if (Array.isArray(event.detail)) {
          // If detail is an array, spread it as additional arguments after the event name
          return handler(event.type, ...event.detail);
        } else if (
          event.detail &&
          typeof event.detail === "object" &&
          "args" in event.detail
        ) {
          // Special case for acknowledgment events which have a different structure
          return handler(event.type, ...event.detail.args);
        } else {
          // Otherwise pass event name and detail as separate arguments
          return handler(event.type, event.detail);
        }
      } else {
        // For non-custom events, just pass the event type
        return handler(event.type);
      }
    };

    // Store the handler mapping for later retrieval or removal
    this.anyOutgoingHandlerRegistry.set(handler, {
      innerHandler,
      once: false,
    });

    // Register with the special "*" event type on the serverEventTarget
    // This is the key difference - we're listening on serverEventTarget
    // which receives events when client emits something
    this.serverEventTarget.addEventListener(CATCH_ALL_EVENT_TYPE, innerHandler);

    // Return the client for chaining
    return this.clientEventTarget;
  };

  public offAnyIncoming = (handler?: OuterHandler): SocketEventTarget => {
    if (handler) {
      const handlerEntry = this.anyIncomingHandlerRegistry.get(handler);

      if (handlerEntry) {
        this.clientEventTarget.removeEventListener(
          CATCH_ALL_EVENT_TYPE,
          handlerEntry.innerHandler,
        );

        this.anyIncomingHandlerRegistry.delete(handler);
        return this.clientEventTarget;
      }
    }

    this.anyIncomingHandlerRegistry.forEach((entry) => {
      this.clientEventTarget.removeEventListener(
        CATCH_ALL_EVENT_TYPE,
        entry.innerHandler,
      );
    });

    this.anyIncomingHandlerRegistry.clear();

    return this.clientEventTarget;
  };

  public offAnyOutgoing = (handler?: OuterHandler): SocketEventTarget => {
    if (handler) {
      const handlerEntry = this.anyOutgoingHandlerRegistry.get(handler);

      if (handlerEntry) {
        this.serverEventTarget.removeEventListener(
          CATCH_ALL_EVENT_TYPE,
          handlerEntry.innerHandler,
        );

        this.anyOutgoingHandlerRegistry.delete(handler);
        return this.clientEventTarget;
      }
    }

    this.anyOutgoingHandlerRegistry.forEach((entry) => {
      this.serverEventTarget.removeEventListener(
        CATCH_ALL_EVENT_TYPE,
        entry.innerHandler,
      );
    });

    this.anyOutgoingHandlerRegistry.clear();

    return this.clientEventTarget;
  };

  public prependAnyIncoming = (handler: OuterHandler): SocketEventTarget => {
    // Create an inner handler that adapts the event format
    const innerHandler = (event: Event) => {
      if (isCustomEvent(event)) {
        // Socket.io's onAny callback signature is (eventName, ...args)
        if (Array.isArray(event.detail)) {
          return handler(event.type, ...event.detail);
        } else {
          return handler(event.type, event.detail);
        }
      } else {
        return handler(event.type);
      }
    };

    // Store the handler mapping for later retrieval or removal
    this.anyIncomingHandlerRegistry.set(handler, {
      innerHandler,
      once: false,
    });

    // We need to modify CustomEventTarget to support prepending
    // For now, we can unshift to anyListeners array instead of push
    this.clientEventTarget.prependEventListener(
      CATCH_ALL_EVENT_TYPE,
      innerHandler,
    );

    return this.clientEventTarget;
  };

  public prependAnyOutgoing = (handler: OuterHandler): SocketEventTarget => {
    // Create an inner handler that adapts the event format for outgoing events
    const innerHandler = (event: Event) => {
      if (isCustomEvent(event)) {
        // Socket.io's onAnyOutgoing callback signature is (eventName, ...args)
        if (Array.isArray(event.detail)) {
          // If detail is an array, spread it as additional arguments after the event name
          return handler(event.type, ...event.detail);
        } else if (
          event.detail &&
          typeof event.detail === "object" &&
          "args" in event.detail
        ) {
          // Special case for acknowledgment events which have a different structure
          return handler(event.type, ...event.detail.args);
        } else {
          // Otherwise pass event name and detail as separate arguments
          return handler(event.type, event.detail);
        }
      } else {
        // For non-custom events, just pass the event type
        return handler(event.type);
      }
    };

    // Store the handler mapping for later retrieval or removal
    this.anyOutgoingHandlerRegistry.set(handler, {
      innerHandler,
      once: false,
    });

    // Register with the special "*" event type on the serverEventTarget
    // Use prependEventListener instead of addEventListener
    this.serverEventTarget.prependEventListener(
      CATCH_ALL_EVENT_TYPE,
      innerHandler,
    );

    // Return the client for chaining
    return this.clientEventTarget;
  };

  public listenersAnyIncoming = (): OuterHandler[] => {
    return Array.from(this.anyIncomingHandlerRegistry.keys());
  };

  public listenersAnyOutgoing = (): OuterHandler[] => {
    return Array.from(this.anyOutgoingHandlerRegistry.keys());
  };
}
