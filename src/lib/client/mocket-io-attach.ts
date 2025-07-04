import { IMocketioClient } from "./mocket-io-client";
import { MockedSocketIoClientApi } from "../types";
import { vi } from "vitest";

export const attachMocketioClient = (
  io: unknown,
  client: IMocketioClient,
): IMocketioClient => {
  const socketFactory = () => {
    return {
      get connected() {
        return client.client.getAttribute("connected");
      },
      get disconnected() {
        return client.client.getAttribute("disconnected");
      },
      get recovered() {
        return client.client.getAttribute("recovered");
      },
      get active() {
        return client.client.getAttribute("active");
      },
      get id() {
        return client.client.getAttribute("id");
      },
      open: client.client.mockOpen,
      close: client.client.mockClose,
      connect: client.client.mockConnect,
      disconnect: client.client.mockDisconnect,
      compress: client.client.mockCompress,
      timeout: client.client.mockTimeout,
      send: client.client.mockSend,
      emit: client.client.mockEmit,
      emitWithAck: client.client.mockEmitWithAck,
      listeners: client.client.mockListeners,
      listenersAny: client.client.mockListenersAnyIncoming,
      listenersAnyOutgoing: client.client.mockListenersAnyOutgoing,
      off: client.client.mockOff,
      offAny: client.client.mockOffAnyIncoming,
      offAnyOutgoing: client.client.mockOffAnyOutgoing,
      on: client.client.mockOn,
      onAny: client.client.mockOnAnyIncoming,
      onAnyOutgoing: client.client.mockOnAnyOutgoing,
      once: client.client.mockOnce,
      prependAny: client.client.mockPrependAnyIncoming,
      prependAnyOutgoing: client.client.mockPrependAnyOutgoing,
    } satisfies MockedSocketIoClientApi;
  };

  socketFactory.lookup = socketFactory; // Alias for main function
  socketFactory.connect = socketFactory; // Another alias
  socketFactory.protocol = 5; // Current Socket.io protocol version
  socketFactory.Manager = class MockManager {};
  socketFactory.Socket = class MockSocket {};

  const mockedIo = vi.mocked(io as any);
  mockedIo.mockImplementation(() => socketFactory());

  mockedIo.lookup = socketFactory;
  mockedIo.connect = socketFactory;
  mockedIo.protocol = 5;
  mockedIo.Manager = class MockManager {};
  mockedIo.Socket = class MockSocket {};

  return {
    client: client.client,
    server: client.server,
  };
};
