import { vi } from "vitest";
import { SocketioClientApi } from "./types.socketio";
import {
  MocketioFixtureExternalApi,
  MocketioFixtureInternalApi,
} from "./types.mocketio";

export const attachMocketioFixture = (
  io: unknown,
  fixture: MocketioFixtureInternalApi,
): MocketioFixtureExternalApi => {
  const socketFactory = () => {
    return {
      get connected() {
        return fixture.client.getAttribute("connected");
      },
      get disconnected() {
        return fixture.client.getAttribute("disconnected");
      },
      get recovered() {
        return fixture.client.getAttribute("recovered");
      },
      get active() {
        return fixture.client.getAttribute("active");
      },
      get id() {
        return fixture.client.getAttribute("id");
      },
      open: fixture.client.mockOpen,
      close: fixture.client.mockClose,
      connect: fixture.client.mockConnect,
      disconnect: fixture.client.mockDisconnect,
      compress: fixture.client.mockCompress,
      timeout: fixture.client.mockTimeout,
      send: fixture.client.mockSend,
      emit: fixture.client.mockEmit,
      emitWithAck: fixture.client.mockEmitWithAck,
      listeners: fixture.client.mockListeners,
      listenersAny: fixture.client.mockListenersAnyIncoming,
      listenersAnyOutgoing: fixture.client.mockListenersAnyOutgoing,
      off: fixture.client.mockOff,
      offAny: fixture.client.mockOffAnyIncoming,
      offAnyOutgoing: fixture.client.mockOffAnyOutgoing,
      on: fixture.client.mockOn,
      onAny: fixture.client.mockOnAnyIncoming,
      onAnyOutgoing: fixture.client.mockOnAnyOutgoing,
      once: fixture.client.mockOnce,
      prependAny: fixture.client.mockPrependAnyIncoming,
      prependAnyOutgoing: fixture.client.mockPrependAnyOutgoing,
    } satisfies SocketioClientApi;
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
    client: {
      getAttributes: fixture.client.getAttributes,
      getAttribute: fixture.client.getAttribute,
      mockAttribute: fixture.client.mockAttribute,
      mockOpen: fixture.client.mockOpen,
      mockClose: fixture.client.mockClose,
      mockConnect: fixture.client.mockConnect,
      mockDisconnect: fixture.client.mockDisconnect,
    },
    server: fixture.server,
  };
};
