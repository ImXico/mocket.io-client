import { describe, it, expect } from "vitest";
import { MockedSocketIoContext } from "./socket-io.mocked-context";

describe("MockedSocketIoContext", () => {
  it("should create an instance with client and server properties", () => {
    const context = new MockedSocketIoContext();

    expect(context).toBeDefined();
    expect(context.client).toBeDefined();
    expect(context.server).toBeDefined();
  });
});
