import { test as baseTest } from "vitest";
import { attachMocketioFixture } from "../lib/fixture/mocket-io-fixture-attacher";
import { MocketioFixture } from "../lib/fixture/mocket-io-fixture";
import { MocketioFixtureExternalApi } from "../lib/fixture/types.mocketio";

export interface MocketioClientFixture {
  mocketio: MocketioFixtureExternalApi;
}

// Create a test that expects the user to provide the mocked io
const withMocketioClient = (io: any) =>
  baseTest.extend<MocketioClientFixture>({
    mocketio: async ({}, use) => {
      // Setup the fixture before each test function
      const mocketio = attachMocketioFixture(io, new MocketioFixture());

      // Use the fixture value
      await use(mocketio);

      // Cleanup - reset the io mock
      io.mockReset();
    },
  });

export {
  withMocketioClient as _testWithMocketioClient,
  withMocketioClient as _itWithMocketioClient,
};
