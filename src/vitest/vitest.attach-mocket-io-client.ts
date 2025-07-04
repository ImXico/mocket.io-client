import { vi } from "vitest";
import { io } from "socket.io-client";
import { test as baseTest } from "vitest";
import { attachMocketioClient } from "../lib/client/mocket-io-client-attacher";
import {
  IMocketioClient,
  MocketioClient,
} from "../lib/client/mocket-io-client";

export interface MocketioClientFixture {
  mocketioClient: IMocketioClient;
}

vi.mock("socket.io-client", async () => {
  const actual = await vi.importActual("socket.io-client");
  return {
    ...actual,
    io: vi.fn(),
  };
});

const withMocketioClient = baseTest.extend<MocketioClientFixture>({
  mocketioClient: async ({}, use) => {
    // Setup the fixture before each test function
    const mocketioClient = attachMocketioClient(io, new MocketioClient());

    // Use the fixture value
    await use(mocketioClient);

    // Cleanup - reset the io mock
    vi.mocked(io).mockReset();
  },
});

export {
  withMocketioClient as testWithMocketioClient,
  withMocketioClient as itWithMocketioClient,
};
