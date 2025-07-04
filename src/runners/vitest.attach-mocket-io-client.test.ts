import { describe, expect, test, vi, afterEach } from "vitest";
import { io as originalIo } from "socket.io-client";
import {
  testWithMocketioClient,
  itWithMocketioClient,
} from "./vitest.attach-mocket-io-client";
import { attachMocketioClient } from "../lib/mocket-io-attach";
import { MocketioClient } from "../lib/mocket-io-client";

vi.mock("../lib/mocket-io-attach", () => ({
  attachMocketioClient: vi.fn().mockImplementation((io, context) => ({
    io,
    context,
    mockImplementation: "mocked",
  })),
}));

vi.mock("../lib/mocket-io-client", () => ({
  MocketioClient: vi.fn().mockImplementation(() => ({
    client: { mockClient: true },
    server: { mockServer: true },
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

  test("testWithMocketioClient provides a IMocketioClient fixture", () => {
    // Use the test runner with our fixture
    testWithMocketioClient(
      "fixture provides mocked socket io",
      ({ mocketioClient }) => {
        // Check that we received the properly constructed mock
        expect(mocketioClient).toBeDefined();
        expect(mocketioClient).toHaveProperty("mockImplementation", "mocked");

        // Verify createMockedSocketIo was called with the right parameters
        expect(attachMocketioClient).toHaveBeenCalledTimes(1);
        expect(attachMocketioClient).toHaveBeenCalledWith(
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

  test("MocketioClient is instantiated for each test", () => {
    vi.mocked(MocketioClient).mockClear();

    testWithMocketioClient("creates new context", () => {
      expect(MocketioClient).toHaveBeenCalledTimes(1);
    });

    vi.mocked(MocketioClient).mockClear();

    testWithMocketioClient("creates another new context", () => {
      expect(MocketioClient).toHaveBeenCalledTimes(1);
    });
  });
});
