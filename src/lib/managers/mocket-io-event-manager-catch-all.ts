import { CATCH_ALL_EVENT_TYPE } from "../constants";
import { MocketioEventTarget } from "../target/socket-event-target";
import { InnerHandler, OuterHandler } from "../types";
import { handleCustomCatchAllEventWithNoAck, isCustomEvent } from "../util";

type AnyEventHandlerRegistry = Map<
  OuterHandler,
  {
    innerHandler: InnerHandler;
    once: boolean;
  }
>;

export class MocketioEventManagerCatchAll {
  constructor(
    private clientEventTarget: MocketioEventTarget,
    private serverEventTarget: MocketioEventTarget,
  ) {}

  private readonly anyIncomingHandlerRegistry: AnyEventHandlerRegistry =
    new Map();

  private readonly anyOutgoingHandlerRegistry: AnyEventHandlerRegistry =
    new Map();

  /**
   * Triggered when the client receives any event from the server.
   * Adds listeners to the end of the queue (i.e. they execute last)
   * @param handler - The handler to be called when any event is received.
   * @returns {MocketioEventTarget} - The client event target for chaining.
   */
  public onAnyIncoming = (handler: OuterHandler): MocketioEventTarget => {
    const innerHandler = (event: Event) => {
      if (isCustomEvent(event) && !event.type.endsWith(":ack")) {
        return handleCustomCatchAllEventWithNoAck(event, handler);
      }
    };
    // For non-custom events, just pass the event type
    // return handler(event.type);

    // Store the handler mapping for later retrieval or removal
    this.anyIncomingHandlerRegistry.set(handler, {
      innerHandler,
      once: false,
    });

    // Register with the special "*" event type in CustomEventTarget
    this.clientEventTarget.addEventListener(CATCH_ALL_EVENT_TYPE, innerHandler);

    return this.clientEventTarget;
  };

  /**
   * Triggered when the client emits any event to the server
   * Adds listeners to the end of the queue (i.e. they execute last)
   * @param handler - The handler to be called when any event is received.
   * @returns {MocketioEventTarget} - The client event target for chaining.
   */
  public onAnyOutgoing = (handler: OuterHandler): MocketioEventTarget => {
    const innerHandler = (event: Event) => {
      if (isCustomEvent(event) && !event.type.endsWith(":ack")) {
        return handleCustomCatchAllEventWithNoAck(event, handler);
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

  public offAnyIncoming = (handler?: OuterHandler): MocketioEventTarget => {
    if (!handler) {
      this.anyIncomingHandlerRegistry.forEach((entry) => {
        this.clientEventTarget.removeEventListener(
          CATCH_ALL_EVENT_TYPE,
          entry.innerHandler,
        );
      });

      this.anyIncomingHandlerRegistry.clear();

      return this.clientEventTarget;
    }

    const handlerEntry = this.anyIncomingHandlerRegistry.get(handler);

    if (handlerEntry) {
      this.clientEventTarget.removeEventListener(
        CATCH_ALL_EVENT_TYPE,
        handlerEntry.innerHandler,
      );

      this.anyIncomingHandlerRegistry.delete(handler);
    }

    return this.clientEventTarget;
  };

  public offAnyOutgoing = (handler?: OuterHandler): MocketioEventTarget => {
    if (!handler) {
      this.anyOutgoingHandlerRegistry.forEach((entry) => {
        this.serverEventTarget.removeEventListener(
          CATCH_ALL_EVENT_TYPE,
          entry.innerHandler,
        );
      });

      this.anyOutgoingHandlerRegistry.clear();

      return this.clientEventTarget;
    }

    const handlerEntry = this.anyOutgoingHandlerRegistry.get(handler);

    if (handlerEntry) {
      this.serverEventTarget.removeEventListener(
        CATCH_ALL_EVENT_TYPE,
        handlerEntry.innerHandler,
      );

      this.anyOutgoingHandlerRegistry.delete(handler);
    }

    return this.clientEventTarget;
  };

  public prependAnyIncoming = (handler: OuterHandler): MocketioEventTarget => {
    // Create an inner handler that adapts the event format
    const innerHandler = (event: Event) => {
      if (isCustomEvent(event) && !event.type.endsWith(":ack")) {
        return handleCustomCatchAllEventWithNoAck(event, handler);
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

  public prependAnyOutgoing = (handler: OuterHandler): MocketioEventTarget => {
    // Create an inner handler that adapts the event format for outgoing events
    const innerHandler = (event: Event) => {
      if (isCustomEvent(event) && !event.type.endsWith(":ack")) {
        return handleCustomCatchAllEventWithNoAck(event, handler);
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
