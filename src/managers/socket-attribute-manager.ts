import { SocketAttributeValue } from "./socket-attribute-manager.types";
import { SocketAttributeKey } from "./socket-attribute-manager.types";
import { SocketAttributes } from "./socket-attribute-manager.types";

export class SocketAttributeManager {
  constructor(private readonly clientEventTarget: unknown) {}

  private readonly attributes: SocketAttributes = {
    active: false,
    connected: false,
    disconnected: true,
    recovered: false,
    id: undefined,
    timeout: undefined,
    compress: true,
    // io: TODO
  };

  public getAttributes = () => {
    return this.attributes;
  };

  public getAttribute = <K extends SocketAttributeKey>(
    key: K
  ): SocketAttributeValue<K> => {
    return this.attributes[key];
  };

  public mockAttribute = <K extends SocketAttributeKey>(
    key: K,
    value: SocketAttributeValue<K>
  ) => {
    this.attributes[key] = value;
    return this.clientEventTarget;
  };

  public connect = () => {
    this.attributes.connected = true;
    return this.clientEventTarget;
  };

  public open = this.connect;

  public disconnect = () => {
    this.attributes.connected = false;
    this.attributes.disconnected = true;
    this.attributes.id = undefined;
    return this.clientEventTarget;
  };

  public close = this.disconnect;

  public timeout = (timeout: number) => {
    this.attributes.timeout = timeout;
    return this.clientEventTarget;
  };

  public compress = (compress: boolean) => {
    this.attributes.compress = compress;
    return this.clientEventTarget;
  };
}
