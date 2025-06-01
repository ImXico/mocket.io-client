import { describe, expect } from "vitest";
import { LiveCounter } from "./client";
import { io } from "socket.io-client";
import { itWithMockedIoContext } from "../src/runners/vitest.setup";

describe("client tests", () => {
  itWithMockedIoContext(
    "the client increments every time it received an 'increment' event",
    async ({ mockedSocketIo }) => {
      const liveCounter = new LiveCounter();

      expect(liveCounter.value).toEqual(0);
      expect(io).toHaveBeenCalledWith("http://localhost:8000");

      const server = mockedSocketIo.server;

      server.mockEmit("connect");
      server.mockEmit("increment");
      server.mockEmit("increment");
      server.mockEmit("increment");

      expect(liveCounter.value).toEqual(3);
    },
  );

  // it("emit three times", async ({ mockedSocketContext }) => {
  //   const { server } = mockSocketIo(io, mockedSocketContext);

  //   const liveCounter = new LiveCounter();
  //   expect(liveCounter.value).toEqual(0);

  //   expect(io).toHaveBeenCalledWith("http://localhost:8000");

  //   server.mockEmit("increment-and-report");

  //   // server.mockCloseConnection()
  //   // assert that client reconnects (somehow?)

  //   expect(liveCounter.value).toEqual(1);
  // });
});
