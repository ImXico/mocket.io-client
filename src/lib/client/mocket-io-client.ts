import {
  SocketAttributeManager,
  SocketEmitManager,
  SocketEventManager,
  SocketEventManagerCatchAll,
} from "../managers";
import { SocketEventTarget } from "../target/socket-event-target";
import {
  MocketioClientContextClientApi,
  MocketioClientContextMinimalServerApi,
} from "./types";

export interface IMocketioClient {
  client: MocketioClientContextClientApi;
  server: MocketioClientContextMinimalServerApi;
}

export class MocketioClient implements IMocketioClient {
  private readonly clientEventTarget = new SocketEventTarget();
  private readonly serverEventTarget = new SocketEventTarget();

  private readonly attributeManager = new SocketAttributeManager(
    this.clientEventTarget,
  );

  private readonly eventManager = new SocketEventManager(
    this.clientEventTarget,
  );

  private readonly eventManagerCatchAll = new SocketEventManagerCatchAll(
    this.clientEventTarget,
    this.serverEventTarget,
  );

  readonly emitManager = new SocketEmitManager(
    this.clientEventTarget,
    this.serverEventTarget,
    this.attributeManager.getAttributes(),
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
    mockListenersAnyIncoming: this.eventManagerCatchAll.listenersAnyIncoming,
    mockListenersAnyOutgoing: this.eventManagerCatchAll.listenersAnyOutgoing,
    mockOff: this.eventManager.off,
    mockOffAnyIncoming: this.eventManagerCatchAll.offAnyIncoming,
    mockOffAnyOutgoing: this.eventManagerCatchAll.offAnyOutgoing,
    mockOn: this.eventManager.clientOn,
    mockOnAnyIncoming: this.eventManagerCatchAll.onAnyIncoming,
    mockOnAnyOutgoing: this.eventManagerCatchAll.onAnyOutgoing,
    mockOnce: this.eventManager.once,
    mockPrependAnyIncoming: this.eventManagerCatchAll.prependAnyIncoming,
    mockPrependAnyOutgoing: this.eventManagerCatchAll.prependAnyOutgoing,
  } satisfies MocketioClientContextClientApi;

  public readonly server = {
    mockEmit: this.emitManager.emitFromServer,
    mockOn: this.emitManager.serverOn,
  } satisfies MocketioClientContextMinimalServerApi;
}
