# mocket.io-client

A Vitest mocking library for testing [socket.io-client](https://socket.io/) integrations without requiring actual server connections.

## Installation

```bash
npm install --save-dev @xikww/mocket.io-client
```

Then, simply update your `vitest.config` to include the setup file:

```typescript
export default defineConfig({
  test: {
    setupFiles: [
      ...,
      "@xikww/mocket.io-client/setup"
    ],
  },
});
```

## Usage

This library exports a single function (two aliases) — a [custom Vitest Test Context](https://vitest.dev/guide/test-context.html#extend-test-context):

```typescript
import {
  itWithMocketioClient, // alias 1
  testWithMocketioClient, // alias 2
} from "@xikww/mocket.io-client/context";
```

For any test wrapped within this context:

```typescript
itWithMocketioClient("your test", ({ mocketio } => {
  // 1. The `socket.io-client` API is, at this point, already mocked behind the scenes
  // 2. A fixture `mocketio` is available (see the API reference below)
}));
```

## Examples

**Basic server-driven connection/disconnection:**

```typescript
describe("my tests", () => {
  itWithMocketioClient("handles connect/disconnect", ({ mocketio }) => {
    // Instantiate your regular object that calls `io(...)`
    chatClient = new ChatRoomClient("http://localhost:9999");

    // Simulate a "connect" event coming from the server
    mocketio.server.mockEmit("connect");

    // Magically works!
    expect(chatClient.isConnected).toBe(true);

    // Simulate a "disconnect" event coming from the server
    mocketio.server.mockEmit("disconnect");

    // Magically works!
    expect(chatClient.isConnected).toBe(false);
    expect(chatClient.currentRoom).toBe("");
    expect(chatClient.users).toEqual([]);
  });
});
```

**Mock server-side handling (e.g. for testing client emissions and server acks):**

```typescript
import { describe, it, expect } from "vitest";
import { itWithMocketioClient } from "@xikww/mocket.io-client/context";
import { YourSocketClient } from "./your-socket-client";

describe("my tests", () => {
  itWithMocketioClient("mock server handler", async ({ mocketio }) => {
    // Instantiate your regular object that calls `io(...)`
    chatClient = new ChatRoomClient("http://localhost:9999");

    // Simulate a "connect" event coming from the server
    mocketio.server.mockEmit("connect");
    expect(chatClient.isConnected).toBe(true);

    // Mock the server-side handler to assert that the payload sent from the
    // client is in the expected format +  acknowledge the client-emitted event
    mocketio.server.mockOn("joinRoom", (username, room, callback) => {
      expect(room).toBe("general");
      callback(true);
    });

    await chatClient.joinRoom("testuser", "general");

    // Simulate other users joining
    mocketioClient.server.mockEmit("userJoined", "user2", 2);
    mocketioClient.server.mockEmit("userJoined", "user3", 3);

    // Should have both other users (not including self)
    expect(chatClient.users).toContain("user2");
    expect(chatClient.users).toContain("user3");
    expect(chatClient.users).toHaveLength(2);
  });
});
```

For more examples, please check the `examples` folder.

## API Reference

The `mocketio` fixture that you can use within your tests has two fields, `client` and `server`.

**Client API**

The goal of this library is to help you seamlessly test your client-side socket.io features — behind the scenes, it already mocks the actual public-facing API of `socket.io-client` in a way that allows for fast, reliable testing. This means that, for the vast majority of cases, you shouldn't need to use the `client` API that the `mocketio` fixture provides. For this reason, the API is minimal to allow for edge cases:

- `client.getAttribute(key)` - Get the values of an attribute by key.
- `client.getAttributes()` - Get the values of all attributes.
- `client.mockAttribute(key, value)` - Manually set the value for an attribute.
- `client.mockOpen()` - Manually trigger a connection.
- `client.mockClose()` - Manually trigger a disconnection.
- `client.mockConnect()` - Alias for `mockOpen`.
- `client.mockDisconnect()` - Alias for `mockClose`.

**Server API**

For client-side integration testing purposes, the server should be a black box; the `server` API provided by the `mocketio` fixture gives us just enough so that we can mock server emissions and event handlers to tailor the client's needs:

- `server.mockEmit(eventName, ...args)` - Simulate an event emission from the server.
- `server.mockOn(eventName, ...args)` - Mock a server-side ad-hoc handler for any event.

## Contributing

```bash
$ clone this repo && cd /to/it
$ pnpm install
$ pnpm build
```

For testing, you can run the following commands:

```bash
$ pnpm test:lib // run the lib tests
$ pnpm test:examples // run the tests in the examples folder
```

This project uses [changesets](https://github.com/changesets/changesets) for changelog management:

```bash
pnpm changeset add
```

## License

Distributed under the terms of the MIT license, "mocked.io-client" is free and open source software.
