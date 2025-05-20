import { Socket } from "socket.io-client";
import { type MockedSocketContext } from "./mocked-socket-io-client";

declare module "vitest" {
  export interface TestContext {
    mockedIo?: Socket;
    mockedSocketContext?: MockedSocketContext;
  }
}
