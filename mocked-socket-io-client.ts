import { SocketAttributeManager } from "./src/managers/socket-attribute-manager";
import { SocketEmitManager } from "./src/managers/socket-emit-manager";
import { SocketEventManagerCatchAll } from "./src/managers/socket-event-manager-catch-all";
import { SocketEventManager } from "./src/managers/socket-event-manager";
import { SocketEventTarget } from "./src/socket-event-target";

export class MockedSocketContext {
  private readonly clientEventTarget = new SocketEventTarget();
  private readonly serverEventTarget = new SocketEventTarget();

  private readonly attributeManager = new SocketAttributeManager(
    this.clientEventTarget
  );

  private readonly eventManager = new SocketEventManager(
    this.clientEventTarget
  );

  private readonly eventManagerCatchAll = new SocketEventManagerCatchAll(
    this.clientEventTarget,
    this.serverEventTarget
  );

  private readonly emitManager = new SocketEmitManager(
    this.clientEventTarget,
    this.serverEventTarget,
    this.attributeManager.getAttributes()
  );

  public readonly client = {
    getAttributes: this.attributeManager.getAttributes,
    getAttribute: this.attributeManager.getAttribute,
    mockAttribute: this.attributeManager.mockAttribute,
    mockOpen: this.attributeManager.open,
    mockClose: this.attributeManager.close,
    mockConnect: this.attributeManager.connect,
    mockDisconnect: this.attributeManager.disconnect,
    mockCompress: this.attributeManager.compress,
    mockTimeout: this.attributeManager.timeout,
    mockSend: this.emitManager.send,
    mockEmit: this.emitManager.emitFromClient,
    mockEmitWithAck: this.emitManager.emitFromClientWithAck,
    mockListeners: this.eventManager.listeners,
    mockListenersAny: this.eventManagerCatchAll.listenersAnyIncoming,
    mockListenersAnyOutgoing: this.eventManagerCatchAll.listenersAnyOutgoing,
    mockOff: this.eventManager.off,
    mockOffAny: this.eventManagerCatchAll.offAnyIncoming,
    mockOffAnyOutgoing: this.eventManagerCatchAll.offAnyOutgoing,
    mockOn: this.eventManager.on,
    mockOnAny: this.eventManagerCatchAll.onAnyIncoming,
    mockOnAnyOutgoing: this.eventManagerCatchAll.onAnyOutgoing,
    mockOnce: this.eventManager.once,
    mockPrependAny: this.eventManagerCatchAll.prependAnyIncoming,
    mockPrependAnyOutgoing: this.eventManagerCatchAll.prependAnyOutgoing,
  };

  public readonly server = {
    mockEmit: this.emitManager.emitFromServer,
    mockAcknowledgeClientEvent: this.emitManager.acknowledgeClientEvent,
  };
}
