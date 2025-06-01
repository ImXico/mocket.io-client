import { Manager } from "socket.io-client";
import { SocketEventTarget } from "../target/socket-event-target";

/**
 * Attributes of a socket connection.
 * These attributes are used to manage the state of the socket connection
 * and to provide a consistent interface for interacting with the socket.
 * @internal
 */
export type SocketAttributes = {
  active: boolean;
  connected: boolean;
  disconnected: boolean;
  recovered: boolean;
  id: string | undefined;
  timeout?: number;
  compress?: boolean;
  io: Manager | null;
};

/**
 * Keys of the socket attributes.
 * These keys are used to access the attributes of the socket connection.
 * @internal
 * @see SocketAttributes
 */
export type SocketAttributeKey = keyof SocketAttributes;

/**
 * Values of the socket attributes.
 * These values are used to manage the state of the socket connection
 * and to provide a consistent interface for interacting with the socket.
 * @internal
 * @see SocketAttributes
 * @see SocketAttributeKey
 */
export type SocketAttributeValue<K extends SocketAttributeKey> =
  SocketAttributes[K];

/**
 * SocketAttributeManager is a class that manages the attributes of a socket connection.
 * It provides methods to get, set, and mock attributes, as well as to connect and disconnect the socket.
 * It is used to manage the state of the socket connection and to provide a consistent interface for interacting with the socket.
 * @internal
 */
export class SocketAttributeManager {
  constructor(private readonly clientEventTarget: SocketEventTarget) {}

  private readonly attributes: SocketAttributes = {
    active: false,
    connected: false,
    disconnected: true,
    recovered: false,
    id: undefined,
    timeout: undefined,
    compress: true,
    io: null,
  };

  public getAttributes = (): SocketAttributes => {
    return this.attributes;
  };

  public getAttribute = <K extends SocketAttributeKey>(
    key: K,
  ): SocketAttributeValue<K> => {
    return this.attributes[key];
  };

  public mockAttribute = <K extends SocketAttributeKey>(
    key: K,
    value: SocketAttributeValue<K>,
  ): SocketEventTarget => {
    this.attributes[key] = value;
    return this.clientEventTarget;
  };

  public connect = (): SocketEventTarget => {
    this.attributes.connected = true;
    return this.clientEventTarget;
  };

  public open = this.connect;

  public disconnect = (): SocketEventTarget => {
    this.attributes.connected = false;
    this.attributes.disconnected = true;
    this.attributes.id = undefined;
    return this.clientEventTarget;
  };

  public close = this.disconnect;

  public timeout = (timeout: number): SocketEventTarget => {
    this.attributes.timeout = timeout;
    return this.clientEventTarget;
  };

  public compress = (compress: boolean): SocketEventTarget => {
    this.attributes.compress = compress;
    return this.clientEventTarget;
  };
}
