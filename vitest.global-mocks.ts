import { afterEach, beforeEach, vi, TestContext } from "vitest";
import { MockedSocketContext } from "./mocked-socket-io-client";

// try {
//   console.log(module.paths);
//   require.resolve("socket.io-client");
//   console.log("socket.io-client can be resolved");
// } catch (e) {
//   console.error("socket.io-client cannot be resolved");
// }

// Mock the socket.io-client module by its name

vi.mock("socket.io-client", async () => {
  console.log("inside MOCK");
  const actual = await vi.importActual("socket.io-client");
  console.log("actual...", actual);
  return {
    ...actual,
    io: vi.fn(),
  };
});

beforeEach(async (context: TestContext) => {
  context.mockedSocketContext = new MockedSocketContext();
});

afterEach(async (context: TestContext) => {
  context.mockedSocketContext = undefined;
});
