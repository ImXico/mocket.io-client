import { vi } from "vitest";
import { io } from "socket.io-client";
import { test as baseTest } from "vitest";
import { attachMocketioFixture } from "../lib/fixture/mocket-io-fixture-attacher";
import { MocketioFixture } from "../lib/fixture/mocket-io-fixture";
import { MocketioFixtureExternalApi } from "../lib/fixture/types.mocketio";

export interface MocketioClientFixture {
  mocketio: MocketioFixtureExternalApi;
}

const withMocketioClient = baseTest.extend<MocketioClientFixture>({
  mocketio: async ({}, use) => {
    // Setup the fixture before each test function
    const mocketio = attachMocketioFixture(io, new MocketioFixture());

    // Use the fixture value
    await use(mocketio);

    // Cleanup - reset the io mock
    vi.mocked(io).mockReset();
  },
});

export {
  withMocketioClient as testWithMocketioClient,
  withMocketioClient as itWithMocketioClient,
};
