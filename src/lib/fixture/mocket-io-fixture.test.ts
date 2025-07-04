import { describe, it, expect } from "vitest";
import { MocketioFixture } from "./mocket-io-fixture";

describe("MocketioFixture", () => {
  it("should create an instance with client and server properties", () => {
    const fixture = new MocketioFixture();

    expect(fixture).toBeDefined();
    expect(fixture.client).toBeDefined();
    expect(fixture.server).toBeDefined();
  });
});
