import { vi } from "vitest";
import { MockedSocketContext } from "./mocked-socket-io-client";

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
      // Socket properties
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

      // Actions
      on: context.client.mockOn,
      once: context.client.mockOnce,
      off: () => {}, // TODO
      emit: context.client.mockEmit,
      // TODO
    };
  });

  return {
    client: context.client,
    server: context.server,
  };
};
