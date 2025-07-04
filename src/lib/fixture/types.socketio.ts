import { MocketioEventTarget } from "../target/mocket-io-event-target";
import { OuterHandler } from "../types";

export type SocketioClientApi = {
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
