import {
  MocketioAttributeManager,
  MocketioEmitManager,
  MocketioEventManager,
  MocketioEventManagerCatchAll,
} from "../managers";
import { MocketioEventTarget } from "../target/mocket-io-event-target";
import {
  MocketioFixtureInternalApi,
  MocketioFixtureInternalClientApi,
  MocketioFixtureInternalServerApi,
} from "./types.mocketio";

export class MocketioFixture implements MocketioFixtureInternalApi {
  private readonly clientEventTarget = new MocketioEventTarget();
  private readonly serverEventTarget = new MocketioEventTarget();

  private readonly attributeManager = new MocketioAttributeManager(
    this.clientEventTarget,
  );

  private readonly eventManager = new MocketioEventManager(
    this.clientEventTarget,
  );

  private readonly eventManagerCatchAll = new MocketioEventManagerCatchAll(
    this.clientEventTarget,
    this.serverEventTarget,
  );

  readonly emitManager = new MocketioEmitManager(
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
  } satisfies MocketioFixtureInternalClientApi;

  public readonly server = {
    mockEmit: this.emitManager.emitFromServer,
    mockOn: this.emitManager.serverOn,
  } satisfies MocketioFixtureInternalServerApi;
}
