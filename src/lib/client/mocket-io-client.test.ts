import { describe, it, expect } from "vitest";
import { MocketioClient } from "./mocket-io-client";

describe("MocketioClient", () => {
  it("should create an instance with client and server properties", () => {
    const client = new MocketioClient();

    expect(client).toBeDefined();
    expect(client.client).toBeDefined();
    expect(client.server).toBeDefined();
  });
});
