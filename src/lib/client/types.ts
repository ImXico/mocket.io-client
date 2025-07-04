import {
  SocketAttributeKey,
  SocketAttributes,
  SocketAttributeValue,
} from "../managers";
import { MocketioEventTarget } from "../target/mocket-io-event-target";
import { OuterHandler } from "../types";

export type MockedSocketIoClientApi = {
  connected: boolean;
  disconnected: boolean;
  recovered: boolean;
  active: boolean;
  id: string | undefined;
  open: () => MocketioEventTarget;
  close: () => MocketioEventTarget;
  connect: () => MocketioEventTarget;
  disconnect: () => MocketioEventTarget;
  compress: (compress: boolean) => MocketioEventTarget;
  timeout: (timeout: number) => MocketioEventTarget;
  send: (
    data: any,
    callback?: (response: any) => void,
  ) => MocketioEventTarget | Promise<void>;
  emit: <T extends string = string>(
    eventKey: T,
    args?: any[],
  ) => MocketioEventTarget;
  emitWithAck: <T extends string = string>(
    eventKey: T,
    ...args: any[]
  ) => Promise<any>;
  listeners: (eventKey: string) => OuterHandler[];
  listenersAny: () => OuterHandler[];
  listenersAnyOutgoing: () => OuterHandler[];
  off: (eventKey: string, handler: OuterHandler) => MocketioEventTarget;
  offAny: (handler: OuterHandler) => MocketioEventTarget;
  offAnyOutgoing: (handler: OuterHandler) => MocketioEventTarget;
  on: <T extends string = string>(
    eventKey: T,
    handler: OuterHandler,
  ) => MocketioEventTarget;
  onAny: (handler: OuterHandler) => MocketioEventTarget;
  onAnyOutgoing: (handler: OuterHandler) => MocketioEventTarget;
  once: <T extends string = string>(
    eventKey: T,
    handler: OuterHandler,
  ) => MocketioEventTarget;
  prependAny: (handler: OuterHandler) => MocketioEventTarget;
  prependAnyOutgoing: (handler: OuterHandler) => MocketioEventTarget;
};

/**
 * The type of the socket.io client.
 * This is a subset of the actual socket.io client API.
 */
export type MocketioClientContextClientApi = {
  getAttributes: () => SocketAttributes;
  getAttribute: <K extends SocketAttributeKey>(
    key: K,
  ) => SocketAttributeValue<K>;
  mockAttribute: <K extends SocketAttributeKey>(
    key: K,
    value: SocketAttributeValue<K>,
  ) => MocketioEventTarget;
  mockOpen: () => MocketioEventTarget;
  mockClose: () => MocketioEventTarget;
  mockConnect: () => MocketioEventTarget;
  mockDisconnect: () => MocketioEventTarget;
  mockCompress: (value: boolean) => MocketioEventTarget;
  mockTimeout: (timeout: number) => MocketioEventTarget;
  mockSend: (
    data: any,
    callback?: (response: any) => void,
  ) => MocketioEventTarget | Promise<void>;
  mockEmit: <T extends string = string>(
    eventKey: T,
    ...args: any[]
  ) => MocketioEventTarget;
  mockEmitWithAck: <T extends string = string>(
    eventKey: T,
    ...args: any[]
  ) => Promise<any>;
  mockListeners: (eventKey: string) => OuterHandler[];
  mockListenersAnyIncoming: () => OuterHandler[];
  mockListenersAnyOutgoing: () => OuterHandler[];
  mockOff: (eventKey: string, handler: OuterHandler) => MocketioEventTarget;
  mockOffAnyIncoming: (handler: OuterHandler) => MocketioEventTarget;
  mockOffAnyOutgoing: (handler: OuterHandler) => MocketioEventTarget;
  mockOn: <T extends string = string>(
    eventKey: T,
    handler: OuterHandler,
  ) => MocketioEventTarget;
  mockOnAnyIncoming: (handler: OuterHandler) => MocketioEventTarget;
  mockOnAnyOutgoing: (handler: OuterHandler) => MocketioEventTarget;
  mockOnce: <T extends string = string>(
    eventKey: T,
    handler: OuterHandler,
  ) => MocketioEventTarget;
  mockPrependAnyIncoming: (handler: OuterHandler) => MocketioEventTarget;
  mockPrependAnyOutgoing: (handler: OuterHandler) => MocketioEventTarget;
};

/**
 * The type of the socket.io server.
 * This is a subset of the actual socket.io server API.
 */
export type MocketioClientContextMinimalServerApi = {
  mockEmit: (eventKey: string, ...args: any[]) => void;
  mockOn: (eventKey: string, handler: (...args: any[]) => any) => void;
};
