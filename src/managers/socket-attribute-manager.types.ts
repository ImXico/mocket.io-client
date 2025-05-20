export type SocketAttributes = {
  active: boolean;
  connected: boolean;
  disconnected: boolean;
  recovered: boolean;
  id: string | undefined;
  timeout?: number;
  compress?: boolean;
};

export type SocketAttributeKey = keyof SocketAttributes;

export type SocketAttributeValue<K extends SocketAttributeKey> =
  SocketAttributes[K];
