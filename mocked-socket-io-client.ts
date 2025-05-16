class CustomEventTarget extends EventTarget {
  private readonly anyListeners: Array<(event: Event) => void> = [];

  addEventListener(
    type: string,
    listener: EventListener,
    options?: AddEventListenerOptions
  ): void {
    super.addEventListener(type, listener, options);

    // Special handling for '*' (catch-all) event type
    if (type === "*") {
      this.anyListeners.push(listener);
    }
  }

  removeEventListener(
    type: string,
    listener: EventListener,
    options?: EventListenerOptions
  ): void {
    super.removeEventListener(type, listener, options);

    // Special handling for '*' (catch-all) event type
    if (type === "*") {
      const index = this.anyListeners.indexOf(listener);
      if (index !== -1) {
        this.anyListeners.splice(index, 1);
      }
    }
  }

  dispatchEvent(event: Event): boolean {
    // Trigger any catch-all listeners
    for (const listener of this.anyListeners) {
      listener.call(this, event);
    }

    // Regular event dispatch
    return super.dispatchEvent(event);
  }
}

const RESERVED_SERVER_EVENTS = {
  connect: "connect",
  connect_error: "connect_error",
  disconnect: "disconnect",
} as const;

type ReservedServerEvent =
  (typeof RESERVED_SERVER_EVENTS)[keyof typeof RESERVED_SERVER_EVENTS];

function isReservedEventFromServer(
  eventKey: string
): eventKey is ReservedServerEvent {
  return (
    eventKey === RESERVED_SERVER_EVENTS.connect ||
    eventKey === RESERVED_SERVER_EVENTS.connect_error ||
    eventKey === RESERVED_SERVER_EVENTS.disconnect
  );
}

function isCustomEvent(event: Event): event is CustomEvent {
  return "detail" in event;
}

type SocketAttributes = {
  active: boolean;
  connected: boolean;
  disconnected: boolean;
  recovered: boolean;
  id: string | undefined;
  timeout?: number;
  compress?: boolean;
};

type SocketAttributeKey = keyof SocketAttributes;
type SocketAttributeValue<K extends SocketAttributeKey> = SocketAttributes[K];

/**
 * DOM-style handler that receives an Event object.
 */
type InnerHandler = (event: Event) => void;

/**
 * Socket.io-style handler that receives the actual data.
 */
type OuterHandler = (...args: any[]) => void;

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

export class MockedSocketContext {
  private readonly clientEventTarget = new CustomEventTarget();
  private readonly serverEventTarget = new CustomEventTarget();

  private readonly handlerRegistry: EventHandlerRegistry = new Map();

  private readonly anyHandlerRegistry: Map<
    OuterHandler,
    {
      innerHandler: InnerHandler;
      once: boolean;
    }
  > = new Map();

  // Add a new registry for outgoing events
  private readonly anyOutgoingHandlerRegistry: Map<
    OuterHandler,
    {
      innerHandler: InnerHandler;
      once: boolean;
    }
  > = new Map();

  private readonly attributes: SocketAttributes = {
    active: false,
    connected: false,
    disconnected: true,
    recovered: false,
    id: undefined,
    timeout: undefined,
    compress: true,
    // io:
  };

  private getAttributes = () => {
    return this.attributes;
  };

  private getAttribute = <K extends SocketAttributeKey>(
    key: K
  ): SocketAttributeValue<K> => {
    return this.attributes[key];
  };

  private mockAttribute = <K extends SocketAttributeKey>(
    key: K,
    value: SocketAttributeValue<K>
  ) => {
    this.attributes[key] = value;
  };

  private mockConnect = () => {
    this.attributes.connected = true;
  };

  private mockDisconnect = () => {
    this.attributes.connected = false;
    this.attributes.disconnected = true;
    this.attributes.id = undefined;
  };

  private mockTimeout = (timeout: number) => {
    // socket.io uses this value to configure connection/acknowledgment timeouts.
    // In our mock, we can store it but it won't affect functionality.
    this.attributes.timeout = timeout;

    // Return the client interface with the updated timeout for chaining.
    return this.client;
  };

  private mockCompress = (compress: boolean) => {
    // In socket.io client, this would enable/disable compression
    // for the next emit. In our mock we can simply track the state.
    this.attributes.compress = compress;

    // Return the client interface with the updated timeout for chaining.
    return this.client;
  };

  private mockOn = (eventKey: string, handler: OuterHandler) => {
    if (!this.handlerRegistry.has(eventKey)) {
      this.handlerRegistry.set(eventKey, new Map());
    }

    const innerHandler = (event: Event) => {
      if (isCustomEvent(event)) {
        // If detail is an array, spread it to match multiple arguments
        if (Array.isArray(event.detail)) {
          return handler(...event.detail);
        }

        // Otherwise pass as a single argument
        return handler(event.detail);
      }
    };

    this.handlerRegistry.get(eventKey)?.set(handler, {
      innerHandler,
      once: false,
    });

    this.clientEventTarget.addEventListener(eventKey, innerHandler);
  };

  private mockOnce = (eventKey: string, handler: OuterHandler) => {
    if (!this.handlerRegistry.has(eventKey)) {
      this.handlerRegistry.set(eventKey, new Map());
    }

    const innerHandler = (event: Event) => {
      if (isCustomEvent(event)) {
        // After handling once, remove the handler.
        this.mockOff(eventKey, handler);

        // If detail is an array, spread it to match multiple arguments
        if (Array.isArray(event.detail)) {
          return handler(...event.detail);
        }

        // Otherwise pass as a single argument
        return handler(event.detail);
      }
    };

    this.handlerRegistry.get(eventKey)?.set(handler, {
      innerHandler,
      once: true,
    });

    this.clientEventTarget.addEventListener(eventKey, innerHandler);
  };

  private mockOff = (eventKey: string, handler: OuterHandler) => {
    const eventHandlers = this.handlerRegistry.get(eventKey);

    if (eventHandlers === undefined) {
      return;
    }

    const handlerEntry = eventHandlers.get(handler);

    if (handlerEntry) {
      // Use the stored innerHandler reference to remove the event listener.
      this.clientEventTarget.removeEventListener(
        eventKey,
        handlerEntry.innerHandler
      );

      // Also clean up the registry.
      eventHandlers.delete(handler);

      // If there are no more handlers for this event, remove the event entry.
      if (eventHandlers.size === 0) {
        this.handlerRegistry.delete(eventKey);
      }
    }
  };

  private mockEmitFromClient = <T extends string = string>(
    eventKey: T,
    args?: any[]
  ) => {
    this.serverEventTarget.dispatchEvent(
      new CustomEvent(eventKey, {
        detail: args,
      })
    );
  };

  private mockEmitFromClientWithAck = <T extends string = string>(
    eventKey: T,
    ...args: any[]
  ) => {
    // Return a promise that will be resolved when the server sends an acknowledgment
    return new Promise<any>((resolve) => {
      // Create a unique callback ID for this acknowledgment
      const ackId = `ack_${Date.now()}_${Math.random()
        .toString(36)
        .substring(2, 9)}`;

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
  private mockSend = (data: any, callback?: (response: any) => void) => {
    if (callback) {
      return this.mockEmitFromClientWithAck("message", data).then(callback);
    }

    return this.mockEmitFromClient("message", [data]);
  };

  private mockEmitReservedFromServer = (eventKey: ReservedServerEvent) => {
    if (eventKey === "connect") {
      console.log(this.attributes);
      this.attributes.connected = true;
      console.log(this.attributes);
      this.attributes.disconnected = false;
      this.attributes.id = String(Date.now());
    }

    if (eventKey === "connect_error") {
      // TODO
      // this.attributes.connected = false;
      // this.attributes.disconnected = true;
      // this.attributes.id = undefined;
    }

    if (eventKey === "disconnect") {
      this.attributes.connected = false;
      this.attributes.disconnected = true;
      this.attributes.id = undefined;
    }

    this.clientEventTarget.dispatchEvent(new CustomEvent(eventKey));
  };

  private mockEmitCustomFromServer = <T extends string = string>(
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

  private mockEmitFromServer = <T extends string = string>(
    eventKey: T,
    args?: any[]
  ) => {
    return isReservedEventFromServer(eventKey)
      ? this.mockEmitReservedFromServer(eventKey)
      : this.mockEmitCustomFromServer(eventKey, args);
  };

  public mockAcknowledgeClientEvent = (ackId: string, response: any) => {
    // Acknowledge on the server, which will trigger the resolve of
    // the promise on the client side (in `mockEmitFromClientWithAck`).
    this.serverEventTarget.dispatchEvent(
      new CustomEvent(ackId, {
        detail: response,
      })
    );
  };

  private mockListeners = (eventKey?: string) => {
    if (eventKey) {
      const eventHandlers = this.handlerRegistry.get(eventKey);
      return !!eventHandlers ? Array.from(eventHandlers.keys()) : [];
    }

    const allHandlers: Record<string, OuterHandler[]> = {};
    this.handlerRegistry.forEach((handlers, event) => {
      allHandlers[event] = Array.from(handlers.keys());
    });

    return allHandlers;
  };

  // Triggered when the client receives any event from the server
  private mockOnAny = (handler: OuterHandler) => {
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
    this.anyHandlerRegistry.set(handler, {
      innerHandler,
      once: false,
    });

    // Register with the special "*" event type in CustomEventTarget
    this.clientEventTarget.addEventListener("*", innerHandler);

    // Return the client for chaining
    return this.client;
  };

  // Triggered when the client emits any event to the server
  private mockOnAnyOutgoing = (handler: OuterHandler) => {
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
    this.serverEventTarget.addEventListener("*", innerHandler);

    // Return the client for chaining
    return this.client;
  };

  private mockListenersAny = () => {
    // Return all catch-all handlers
    return Array.from(this.anyHandlerRegistry.keys());
  };

  private mockListenersAnyOutgoing = () => {
    // Return all outgoing catch-all handlers
    return Array.from(this.anyOutgoingHandlerRegistry.keys());
  };

  public readonly client = {
    getAttributes: this.getAttributes,
    getAttribute: this.getAttribute,
    mockAttribute: this.mockAttribute,
    mockClose: this.mockDisconnect,
    mockCompress: this.mockCompress,
    connect: this.mockConnect,
    disconnect: this.mockDisconnect,
    mockEmit: this.mockEmitFromClient,
    mockEmitWithAck: this.mockEmitFromClientWithAck,
    mockListeners: this.mockListeners,
    mockListenersAny: this.mockListenersAny,
    mockListenersAnyOutgoing: this.mockListenersAnyOutgoing,
    mockOff: this.mockOff,
    // mockOffAny
    // mockOffAnyOutgoing
    mockOn: this.mockOn,
    mockOnAny: this.mockOnAny,
    mockOnAnyOutgoing: this.mockOnAnyOutgoing,
    mockOnce: this.mockOnce,
    mockOpen: this.mockConnect,
    // mockPrependAny
    // mockPrependAnyOutgoing
    mockSend: this.mockSend,
    mockTimeout: this.mockTimeout,
  };

  public readonly server = {
    mockEmit: this.mockEmitFromServer,
    mockAcknowledgeClientEvent: this.mockAcknowledgeClientEvent,
  };
}
