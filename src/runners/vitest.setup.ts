import { vi } from "vitest";
import { io } from "socket.io-client";
import { test as baseTest } from "vitest";
import { mockSocketIo } from "../lib/socket-io.mock-environment";
import { MockedSocketIoContext } from "../lib/socket-io.mocked-context";
import { MockedSocketIo } from "../lib/types";

export interface MockedIoClientTestContext {
  mockedSocketIo: MockedSocketIo;
}

vi.mock("socket.io-client", async () => {
  const actual = await vi.importActual("socket.io-client");
  return {
    ...actual,
    io: vi.fn(),
  };
});

const withMockedIoContext = baseTest.extend<MockedIoClientTestContext>({
  mockedSocketIo: async ({}, use) => {
    // Setup the fixture before each test function
    const socketIoContext = new MockedSocketIoContext();
    const mockedSocketIo = mockSocketIo(io, socketIoContext);

    // Use the fixture value
    await use(mockedSocketIo);

    // Cleanup - reset the io mock
    vi.mocked(io).mockReset();
  },
});

export {
  withMockedIoContext as testWithMockedIoContext,
  withMockedIoContext as itWithMockedIoContext,
};
