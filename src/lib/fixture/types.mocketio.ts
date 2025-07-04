import {
  SocketAttributeKey,
  SocketAttributes,
  SocketAttributeValue,
} from "../managers";
import { MocketioEventTarget } from "../target/mocket-io-event-target";
import { OuterHandler } from "../types";

/**
 * TODO
 */
export type MocketioFixtureInternalClientApi = {
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
 * This is a subset of the actual socket.io-client API.
 * We're only exposing fixture methods that provide testing value not available through the regular API
 */
export type MocketioFixtureExternalClientApi = Pick<
  MocketioFixtureInternalClientApi,
  | "getAttributes"
  | "getAttribute"
  | "mockAttribute"
  | "mockOpen"
  | "mockClose"
  | "mockConnect"
  | "mockDisconnect"
>;

/**
 * TODO
 * This is a subset of the actual socket.io server API.
 */
type MocketioFixtureServerApi = {
  mockEmit: (eventKey: string, ...args: any[]) => void;
  mockOn: (eventKey: string, handler: (...args: any[]) => any) => void;
};

export type MocketioFixtureInternalServerApi = MocketioFixtureServerApi;
export type MocketioFixtureExternalServerApi = MocketioFixtureServerApi;

export interface MocketioFixtureInternalApi {
  client: MocketioFixtureInternalClientApi;
  server: MocketioFixtureInternalServerApi;
}

export interface MocketioFixtureExternalApi {
  client: MocketioFixtureExternalClientApi;
  server: MocketioFixtureExternalServerApi;
}
