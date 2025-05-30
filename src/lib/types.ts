import {
  SocketAttributeKey,
  SocketAttributes,
  SocketAttributeValue,
} from "./managers";
import { SocketEventTarget } from "./target/socket-event-target";

/**
 * DOM-style handler that receives an Event object.
 */
export type InnerHandler = (event: Event) => void;

/**
 * Socket.io-style handler that receives the actual data.
 */
export type OuterHandler = (...args: any[]) => void;

export type MockedSocketIoClientApi = {
  connected: boolean;
  disconnected: boolean;
  recovered: boolean;
  active: boolean;
  id: string | undefined;
  open: () => SocketEventTarget;
  close: () => SocketEventTarget;
  connect: () => SocketEventTarget;
  disconnect: () => SocketEventTarget;
  compress: (compress: boolean) => SocketEventTarget;
  timeout: (timeout: number) => SocketEventTarget;
  send: (
    data: any,
    callback?: (response: any) => void,
  ) => SocketEventTarget | Promise<void>;
  emit: <T extends string = string>(
    eventKey: T,
    args?: any[],
  ) => SocketEventTarget;
  emitWithAck: <T extends string = string>(
    eventKey: T,
    ...args: any[]
  ) => Promise<any>;
  listeners: (event: string) => OuterHandler[];
  listenersAny: () => OuterHandler[];
  listenersAnyOutgoing: () => OuterHandler[];
  off: (eventKey: string, handler: OuterHandler) => SocketEventTarget;
  offAny: (handler: OuterHandler) => SocketEventTarget;
  offAnyOutgoing: (handler: OuterHandler) => SocketEventTarget;
  on: <T extends string = string>(
    event: T,
    handler: OuterHandler,
  ) => SocketEventTarget;
  onAny: (handler: OuterHandler) => SocketEventTarget;
  onAnyOutgoing: (handler: OuterHandler) => SocketEventTarget;
  once: <T extends string = string>(
    event: T,
    handler: OuterHandler,
  ) => SocketEventTarget;
  prependAny: (handler: OuterHandler) => SocketEventTarget;
  prependAnyOutgoing: (handler: OuterHandler) => SocketEventTarget;
};

/**
 * The type of the socket.io client.
 * This is a subset of the actual socket.io client API.
 */
export type MockedSocketIoContextClient = {
  getAttributes: () => SocketAttributes;
  getAttribute: <K extends SocketAttributeKey>(
    key: K,
  ) => SocketAttributeValue<K>;
  mockAttribute: <K extends SocketAttributeKey>(
    key: K,
    value: SocketAttributeValue<K>,
  ) => SocketEventTarget;

  // Updated methods to better match MockedSocketIoClientApi
  mockOpen: () => SocketEventTarget;
  mockClose: () => SocketEventTarget;
  mockConnect: () => SocketEventTarget;
  mockDisconnect: () => SocketEventTarget;
  mockCompress: (value: boolean) => SocketEventTarget;
  mockTimeout: (timeout: number) => SocketEventTarget;
  mockSend: (
    data: any,
    callback?: (response: any) => void,
  ) => SocketEventTarget | Promise<void>;
  mockEmit: <T extends string = string>(
    eventKey: T,
    ...args: any[]
  ) => SocketEventTarget;
  mockEmitWithAck: <T extends string = string>(
    eventKey: T,
    ...args: any[]
  ) => Promise<any>;
  mockListeners: (event: string) => OuterHandler[];
  mockListenersAnyIncoming: () => OuterHandler[];
  mockListenersAnyOutgoing: () => OuterHandler[];
  mockOff: (eventKey: string, handler: OuterHandler) => SocketEventTarget;
  mockOffAnyIncoming: (handler: OuterHandler) => SocketEventTarget;
  mockOffAnyOutgoing: (handler: OuterHandler) => SocketEventTarget;
  mockOn: <T extends string = string>(
    event: T,
    handler: OuterHandler,
  ) => SocketEventTarget;
  mockOnAnyIncoming: (handler: OuterHandler) => SocketEventTarget;
  mockOnAnyOutgoing: (handler: OuterHandler) => SocketEventTarget;
  mockOnce: <T extends string = string>(
    event: T,
    handler: OuterHandler,
  ) => SocketEventTarget;
  mockPrependAnyIncoming: (handler: OuterHandler) => SocketEventTarget;
  mockPrependAnyOutgoing: (handler: OuterHandler) => SocketEventTarget;
};

/**
 * The type of the socket.io server.
 * This is a subset of the actual socket.io server API.
 */
export type MockSocketIoContextMinimalServer = {
  mockEmit: (event: string, ...args: any[]) => void;
  mockAcknowledgeClientEvent: (ackId: string, response: any) => void;
};

/**
 * The type of the mocked Socket.io context.
 * This is used to mock the Socket.io client and server in tests.
 */
export type MockedSocketIo = {
  client: MockedSocketIoContextClient;
  server: MockSocketIoContextMinimalServer;
};
