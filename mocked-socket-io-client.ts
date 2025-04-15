class CustomEventTarget extends EventTarget {
  // TODO see if somethign makes sense to add here?
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

function handle(event: Event, handler: Function) {
  console.log("is custom event?");
  if (isCustomEvent(event)) {
    console.log(isCustomEvent(event));
    return handler.apply(null, event.detail);
  }
}

type SocketAttributes = {
  active: boolean;
  connected: boolean;
  disconnected: boolean;
  recovered: boolean;
  id: string | undefined;
};

type SocketAttributeKey = keyof SocketAttributes;
type SocketAttributeValue<K extends SocketAttributeKey> = SocketAttributes[K];

export class MockedSocketContext {
  private readonly clientEventTarget = new CustomEventTarget();
  private readonly serverEventTarget = new CustomEventTarget();

  // TODO
  // private readonly handlerRegistry: Map<
  //   string,
  //   Map<Function, { once: boolean }>
  // > = new Map();

  private readonly attributes: SocketAttributes = {
    active: false,
    connected: false,
    disconnected: true,
    recovered: false,
    id: undefined,
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

  private mockOn = (eventKey: string, handler: Function) => {
    // if (!this.handlerRegistry.has(eventKey)) {
    //   this.handlerRegistry.set(eventKey, new Map());
    // }

    // this.handlerRegistry.get(eventKey)?.set(handler, { once: false });

    this.clientEventTarget.addEventListener(eventKey, (event) => {
      console.log("LISTENERR HANDLET", eventKey);
      handle(event, handler);
    });
  };

  private mockOnce = (eventKey: string, handler: Function) => {
    this.clientEventTarget.addEventListener(
      eventKey,
      (event) => {
        handle(event, handler);
      },
      {
        once: true,
      }
    );
  };

  private mockOff = (eventKey: string, handler: Function) => {
    // TODO so in the end we will need to register the handler(s) for each event, so that we can unregister...
    // or abort signal? no because we might want to off specific callbacks only
    // this.clientEventTarget.removeEventListener(eventKey, handler);
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

  private mockEmitReservedFromServer = (eventKey: ReservedServerEvent) => {
    console.log("@ MOCK EMIT RESERVED @@@@@");
    if (eventKey === "connect") {
      console.log("entering IF 'connect'");
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

  public readonly client = {
    getAttributes: this.getAttributes,
    getAttribute: this.getAttribute,
    mockAttribute: this.mockAttribute,
    // mockClose
    // mockCompress
    connect: this.mockConnect,
    // disconnect: this.mockDisconnect,
    mockEmit: this.mockEmitFromClient,
    // mockEmitWithAck
    // mockListeners:
    // mockListenersAny
    // mockListenersAnyOutgoing
    // mockOff
    // mockOffAny
    // mockOffAnyOutgoing
    mockOn: this.mockOn,
    // mockOnAny
    // mockOnAnyOutgoing
    mockOnce: this.mockOnce,
    // mockOpen
    // mockPrependAny
    // mockPrependAnyOutgoing
    // mockSend
    // mockTimeout
  };

  public readonly server = {
    mockEmit: this.mockEmitFromServer,
  };
}
