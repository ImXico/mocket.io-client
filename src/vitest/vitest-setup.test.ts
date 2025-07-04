import { describe, expect, test, vi, afterEach } from "vitest";
import { io as originalIo } from "socket.io-client";
import { attachMocketioFixture } from "../lib/fixture/mocket-io-fixture-attacher";
import { MocketioFixture } from "../lib/fixture/mocket-io-fixture";
import { itWithMocketioClient, testWithMocketioClient } from "./vitest-context";

vi.mock("../lib/fixture/mocket-io-fixture", () => ({
  MocketioFixture: vi.fn().mockImplementation(() => ({
    client: { mockClient: true },
    server: { mockServer: true },
  })),
}));

vi.mock("../lib/fixture/mocket-io-fixture-attacher", () => ({
  attachMocketioFixture: vi.fn().mockImplementation((io, context) => ({
    io,
    context,
    mockImplementation: "mocked",
  })),
}));

describe("vitest.setup.ts", () => {
  // Mock io is already set up by vitest.setup.ts
  afterEach(() => {
    vi.clearAllMocks();
  });

  test("socket.io-client is properly mocked", () => {
    expect(vi.isMockFunction(originalIo)).toBe(true);
  });

  test("testWithMocketioClient provides a fixture", () => {
    // Use the test runner with our fixture
    testWithMocketioClient(
      "fixture provides mocked socket io",
      ({ mocketio }) => {
        // Check that we received the properly constructed mock
        expect(mocketio).toBeDefined();
        expect(mocketio).toHaveProperty("mockImplementation", "mocked");

        // Verify attachMocketioFixture was called with the right parameters
        expect(attachMocketioFixture).toHaveBeenCalledTimes(1);
        expect(attachMocketioFixture).toHaveBeenCalledWith(
          originalIo,
          expect.any(Object),
        );
      },
    );

    // Verify that the io mock is reset after the test
    expect(originalIo).toHaveBeenCalledTimes(0);
  });

  test("itWithMocketioClient is an alias for testWithMocketioClient", () => {
    expect(itWithMocketioClient).toBe(testWithMocketioClient);
  });

  test.only("MocketioFixture is instantiated for each test", () => {
    vi.mocked(MocketioFixture).mockClear();

    testWithMocketioClient("creates new context", () => {
      expect(MocketioFixture).toHaveBeenCalledTimes(1);
    });

    vi.mocked(MocketioFixture).mockClear();

    testWithMocketioClient("creates another new context", () => {
      expect(MocketioFixture).toHaveBeenCalledTimes(1);
    });
  });
});
