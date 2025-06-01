import { describe, expect, test, vi, afterEach } from "vitest";
import { io as originalIo } from "socket.io-client";
import { testWithMockedIoContext, itWithMockedIoContext } from "./vitest.setup";
import { mockSocketIo } from "../lib/socket-io.mock-environment";
import { MockedSocketIoContext } from "../lib/socket-io.mocked-context";

// Need to mock these modules to avoid circular mocking
vi.mock("../lib/socket-io.mock-environment", () => ({
  mockSocketIo: vi.fn().mockImplementation((io, context) => ({
    io,
    context,
    mockImplementation: "mocked",
  })),
}));

vi.mock("../lib/socket-io.mocked-context", () => ({
  MockedSocketIoContext: vi.fn().mockImplementation(() => ({
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

  test("testWithMockedIoContext provides a MockedSocketIo fixture", async () => {
    // Use the test runner with our fixture
    await testWithMockedIoContext(
      "fixture provides mocked socket io",
      ({ mockedSocketIo }) => {
        // Check that we received the properly constructed mock
        expect(mockedSocketIo).toBeDefined();
        expect(mockedSocketIo).toHaveProperty("mockImplementation", "mocked");

        // Verify mockSocketIo was called with the right parameters
        expect(mockSocketIo).toHaveBeenCalledTimes(1);
        expect(mockSocketIo).toHaveBeenCalledWith(
          originalIo,
          expect.any(Object),
        );
      },
    );

    // Verify that the io mock is reset after the test
    expect(originalIo).toHaveBeenCalledTimes(0);
  });

  test("itWithMockedIoContext is an alias for testWithMockedIoContext", () => {
    expect(itWithMockedIoContext).toBe(testWithMockedIoContext);
  });

  test("MockedSocketIoContext is instantiated for each test", async () => {
    // Reset the mock call count
    vi.mocked(MockedSocketIoContext).mockClear();

    await testWithMockedIoContext("creates new context", () => {
      expect(MockedSocketIoContext).toHaveBeenCalledTimes(1);
    });

    vi.mocked(MockedSocketIoContext).mockClear();

    await testWithMockedIoContext("creates another new context", () => {
      expect(MockedSocketIoContext).toHaveBeenCalledTimes(1);
    });
  });
});
