import { MocketioEventTarget } from "../target/mocket-io-event-target";
import { InnerHandler, OuterHandler } from "../types";
import { handleCustomEventWithNoAck, isCustomEvent } from "../util";

/*
 * A registry of event handlers, where the key is the event type and the value is a map
 * of handlers. The inner map's key is the handler function, and the value is an object
 * containing the inner handler and a boolean indicating if it should be called once.
 */
type EventHandlerRegistry = Map<
  string,
  Map<
    OuterHandler,
    {
      innerHandler: InnerHandler;
      once: boolean;
    }
  >
>;

export class MocketioEventManager {
  constructor(private clientEventTarget: MocketioEventTarget) {}

  private readonly handlerRegistry: EventHandlerRegistry = new Map();

  public clientOn = (
    eventKey: string,
    handler: OuterHandler,
  ): MocketioEventTarget => {
    if (!this.handlerRegistry.has(eventKey)) {
      this.handlerRegistry.set(eventKey, new Map());
    }

    const innerHandler = (event: Event) => {
      if (isCustomEvent(event)) {
        return handleCustomEventWithNoAck(event, handler);
      }
    };

    this.handlerRegistry.get(eventKey)?.set(handler, {
      innerHandler,
      once: false,
    });

    this.clientEventTarget.addEventListener(eventKey, innerHandler);

    return this.clientEventTarget;
  };

  public once = (
    eventKey: string,
    handler: OuterHandler,
  ): MocketioEventTarget => {
    if (!this.handlerRegistry.has(eventKey)) {
      this.handlerRegistry.set(eventKey, new Map());
    }

    const innerHandler = (event: Event) => {
      if (isCustomEvent(event)) {
        // Remove the handler first to ensure it only runs once
        this.off(eventKey, handler);
        return handleCustomEventWithNoAck(event, handler);
      }
    };

    this.handlerRegistry.get(eventKey)?.set(handler, {
      innerHandler,
      once: true,
    });

    this.clientEventTarget.addEventListener(eventKey, innerHandler);

    return this.clientEventTarget;
  };

  public off = (
    eventKey: string,
    handler: OuterHandler,
  ): MocketioEventTarget => {
    const eventHandlers = this.handlerRegistry.get(eventKey);

    if (eventHandlers === undefined) {
      return this.clientEventTarget;
    }

    const handlerEntry = eventHandlers.get(handler);

    if (handlerEntry) {
      this.clientEventTarget.removeEventListener(
        eventKey,
        handlerEntry.innerHandler,
      );

      eventHandlers.delete(handler);

      if (eventHandlers.size === 0) {
        this.handlerRegistry.delete(eventKey);
      }
    }

    return this.clientEventTarget;
  };

  public listeners = (eventKey?: string): OuterHandler[] => {
    if (eventKey) {
      const eventHandlers = this.handlerRegistry.get(eventKey);
      return !!eventHandlers ? Array.from(eventHandlers.keys()) : [];
    }

    return Array.from(this.handlerRegistry.values()).flatMap((handlers) =>
      Array.from(handlers.keys()),
    );
  };
}
