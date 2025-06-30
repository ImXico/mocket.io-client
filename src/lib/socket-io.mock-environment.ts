import { MockedSocketIoContext } from "./socket-io.mocked-context";
import { MockedSocketIo, MockedSocketIoClientApi } from "./types";
import { vi } from "vitest";

export const mockSocketIo = (
  io: unknown,
  context: MockedSocketIoContext,
): MockedSocketIo => {
  const socketFactory = () => {
    return {
      get connected() {
        return context.client.getAttribute("connected");
      },
      get disconnected() {
        return context.client.getAttribute("disconnected");
      },
      get recovered() {
        return context.client.getAttribute("recovered");
      },
      get active() {
        return context.client.getAttribute("active");
      },
      get id() {
        return context.client.getAttribute("id");
      },
      open: context.client.mockOpen,
      close: context.client.mockClose,
      connect: context.client.mockConnect,
      disconnect: context.client.mockDisconnect,
      compress: context.client.mockCompress,
      timeout: context.client.mockTimeout,
      send: context.client.mockSend,
      emit: context.client.mockEmit,
      emitWithAck: context.client.mockEmitWithAck,
      listeners: context.client.mockListeners,
      listenersAny: context.client.mockListenersAnyIncoming,
      listenersAnyOutgoing: context.client.mockListenersAnyOutgoing,
      off: context.client.mockOff,
      offAny: context.client.mockOffAnyIncoming,
      offAnyOutgoing: context.client.mockOffAnyOutgoing,
      on: context.client.mockOn,
      onAny: context.client.mockOnAnyIncoming,
      onAnyOutgoing: context.client.mockOnAnyOutgoing,
      once: context.client.mockOnce,
      prependAny: context.client.mockPrependAnyIncoming,
      prependAnyOutgoing: context.client.mockPrependAnyOutgoing,
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
    client: context.client,
    server: context.server,
  };
};
