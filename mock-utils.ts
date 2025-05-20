import { vi } from "vitest";
import { MockedSocketContext } from "./mocked-socket-io-client";
import { MockedSocketIo } from "./src/types";

export const mockSocketIo = (
  io: unknown,
  context: MockedSocketContext | undefined
) => {
  if (context === undefined) {
    throw new Error(
      "Make sure to include the `vitest.global-mocks` in your vitest setup files."
    );
  }

  // @ts-expect-error - we're mocking just the public API.
  vi.mocked(io).mockImplementation(() => {
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
    } satisfies MockedSocketIo;
  });

  return {
    client: context.client,
    server: context.server,
  };
};
