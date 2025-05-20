import { SocketEventTarget } from "./socket-event-target";

/**
 * DOM-style handler that receives an Event object.
 */
export type InnerHandler = (event: Event) => void;

/**
 * Socket.io-style handler that receives the actual data.
 */
export type OuterHandler = (...args: any[]) => void;

export type MockedSocketIo = {
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
    callback?: (response: any) => void
  ) => SocketEventTarget | Promise<void>;
  emit: <T extends string = string>(
    eventKey: T,
    args?: any[]
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
    handler: OuterHandler
  ) => SocketEventTarget;
  onAny: (handler: OuterHandler) => SocketEventTarget;
  onAnyOutgoing: (handler: OuterHandler) => SocketEventTarget;
  once: <T extends string = string>(
    event: T,
    handler: OuterHandler
  ) => SocketEventTarget;
  prependAny: (handler: OuterHandler) => SocketEventTarget;
  prependAnyOutgoing: (handler: OuterHandler) => SocketEventTarget;
};

/**
 * The type of the socket.io client.
 * This is a subset of the actual socket.io client API.
 */
// export type MockSocketClient = {
//   connected: boolean;
//   disconnected: boolean;
//   recovered: boolean;
//   active: boolean;
//   id: string | null;
//   open: () => void;
//   close: () => void;
//   connect: () => void;
//   disconnect: () => void;
//   compress: (compress: boolean) => void;
//   timeout: (timeout: number) => void;
//   send: (data: any) => void;
//   emit: (event: string, ...args: any[]) => void;
//   emitWithAck: (event: string, ...args: any[]) => Promise<any>;
//   listeners: (event: string) => OuterHandler[];
//   listenersAny: (event: string) => OuterHandler[];
//   listenersAnyOutgoing: (event: string) => OuterHandler[];
//   off: (event: string, handler?: OuterHandler) => void;
//   offAny: (event: string, handler?: OuterHandler) => void;
//   offAnyOutgoing: (event: string, handler?: OuterHandler) => void;
//   on: (event: string, handler: OuterHandler) => void;
//   onAny: (event: string, handler: OuterHandler) => void;
//   onAnyOutgoing: (event: string, handler: OuterHandler) => void;
//   once: (event: string, handler: OuterHandler) => void;
//   prependAny: (event: string, handler: OuterHandler) => void;
//   prependAnyOutgoing: (event: string, handler: OuterHandler) => void;
// };

// /**
//  * The type of the socket.io server.
//  * This is a subset of the actual socket.io server API.
//  */
// export type MockSocketServer = {
//   mockEmit: (event: string, ...args: any[]) => void;
//   mockAcknowledgeClientEvent: (ackId: string, response: any) => void;
// };
