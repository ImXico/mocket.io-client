import { describe, it, expect } from "vitest";
import { LiveCounter } from "./client";

import { io } from "socket.io-client";
import { MockedSocketIo } from "../src/lib/types";
import { itWithMockedIoContext } from "../src/runners/vitest.setup";

describe("client tests", () => {
  itWithMockedIoContext(
    "the client increments every time it received an 'increment' event",
    async ({ mockedSocketIo }) => {
      // TODO when doing io().... we'll mock just the public api
      // see what's the .auth?

      const server = mockedSocketIo.server;
      // console.log(mockedSocketIo);
      // TODO socket.io-client exports lookup as io, lookup as connect, ...
      // console.log("@CONSUMER TEST: ", connect);

      const liveCounter = new LiveCounter();

      expect(liveCounter.value).toEqual(0);
      expect(io).toHaveBeenCalledWith("http://localhost:8000");

      server.mockEmit("connect");

      server.mockEmit("increment");
      server.mockEmit("increment");
      server.mockEmit("increment");

      expect(liveCounter.value).toEqual(3);

      // expect(server.emissions).toEqual(3);
      // server.mockCloseConnection()
      // expect(client.emissions).toEqual(0);
      // also detect/? broken/closed connections?
    }
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
