import { describe, it, expect, beforeEach, vi, afterEach } from "vitest";
import { ChatRoomClient, ChatMessage } from "./chat-room-client";
import { itWithMocketioClient } from "../src/runners/vitest.attach-mocket-io-client";

describe("ChatRoomClient", () => {
  let chatClient: ChatRoomClient;

  beforeEach(() => {
    vi.resetAllMocks();
    vi.spyOn(console, "info").mockImplementation(() => {});
    vi.spyOn(console, "error").mockImplementation(() => {});
  });

  afterEach(() => {
    if (chatClient) {
      chatClient.disconnect();
    }
  });

  describe("Connection Management", () => {
    itWithMocketioClient(
      "should connect successfully",
      async ({ mockedSocketIo }) => {
        chatClient = new ChatRoomClient("http://localhost:9999");

        // Mock successful connection
        mockedSocketIo.server.mockEmit("connect");

        const result = await chatClient.connect();
        expect(result).toBe(true);
        expect(chatClient.isConnected).toBe(true);
      },
    );

    itWithMocketioClient(
      "should handle disconnect",
      async ({ mockedSocketIo }) => {
        chatClient = new ChatRoomClient("http://localhost:9999");

        // Connect successfully
        mockedSocketIo.server.mockEmit("connect");

        await chatClient.connect();
        expect(chatClient.isConnected).toBe(true);

        // Then disconnect
        mockedSocketIo.server.mockEmit("disconnect");
        chatClient.disconnect();

        expect(chatClient.isConnected).toBe(false);
        expect(chatClient.currentRoom).toBe("");
        expect(chatClient.users).toEqual([]);
      },
    );

    itWithMocketioClient(
      "should handle server-initiated disconnect",
      async ({ mockedSocketIo }) => {
        chatClient = new ChatRoomClient("http://localhost:9999");

        // Connect successfully
        mockedSocketIo.server.mockEmit("connect");
        await chatClient.connect();
        expect(chatClient.isConnected).toBe(true);

        // Server initiates disconnect
        mockedSocketIo.server.mockEmit("disconnect");
        expect(chatClient.isConnected).toBe(false);
      },
    );
  });

  describe("Room Management", () => {
    itWithMocketioClient(
      "should join room successfully",
      async ({ mockedSocketIo }) => {
        chatClient = new ChatRoomClient("http://localhost:9999");

        // Connect successfully
        mockedSocketIo.server.mockEmit("connect");
        await chatClient.connect();

        // Setup room join handler
        mockedSocketIo.server.mockOn("joinRoom", (username, room, callback) => {
          expect(username).toBe("testuser");
          expect(room).toBe("general");
          callback(true);
        });

        const result = await chatClient.joinRoom("testuser", "general");
        expect(result).toBe(true);
        expect(chatClient.username).toBe("testuser");
        expect(chatClient.currentRoom).toBe("general");
      },
    );

    itWithMocketioClient(
      "should fail to join room when not connected",
      async ({ mockedSocketIo }) => {
        chatClient = new ChatRoomClient("http://localhost:9999");
        // Not connecting

        const result = await chatClient.joinRoom("testuser", "general");
        expect(result).toBe(false);
        expect(chatClient.username).toBe("");
        expect(chatClient.currentRoom).toBe("");
      },
    );

    itWithMocketioClient(
      "should handle room join rejection from server",
      async ({ mockedSocketIo }) => {
        chatClient = new ChatRoomClient("http://localhost:9999");

        // Connect successfully
        mockedSocketIo.server.mockEmit("connect");
        await chatClient.connect();

        // Setup room join handler with rejection
        mockedSocketIo.server.mockOn("joinRoom", (username, room, callback) => {
          callback(false, "Room is full");
        });

        const result = await chatClient.joinRoom("testuser", "general");
        expect(result).toBe(false);
        expect(chatClient.username).toBe("");
        expect(chatClient.currentRoom).toBe("");
      },
    );

    itWithMocketioClient(
      "should leave room successfully",
      async ({ mockedSocketIo }) => {
        chatClient = new ChatRoomClient("http://localhost:9999");

        // Connect and join room
        mockedSocketIo.server.mockEmit("connect");
        await chatClient.connect();

        mockedSocketIo.server.mockOn("joinRoom", (username, room, callback) => {
          callback(true);
        });

        await chatClient.joinRoom("testuser", "general");

        // Setup leave room handler
        mockedSocketIo.server.mockOn("leaveRoom", (callback) => {
          callback(true);
        });

        const result = await chatClient.leaveRoom();
        expect(result).toBe(true);
        expect(chatClient.currentRoom).toBe("");
        expect(chatClient.users).toEqual([]);
      },
    );

    itWithMocketioClient(
      "should fail to leave room when not in a room",
      async ({ mockedSocketIo }) => {
        chatClient = new ChatRoomClient("http://localhost:9999");

        // Connect but don't join a room
        mockedSocketIo.server.mockEmit("connect");
        await chatClient.connect();

        const result = await chatClient.leaveRoom();
        expect(result).toBe(false);
      },
    );
  });

  describe("Message Handling", () => {
    itWithMocketioClient(
      "should send message successfully",
      async ({ mockedSocketIo }) => {
        chatClient = new ChatRoomClient("http://localhost:9999");

        // Connect and join room
        mockedSocketIo.server.mockEmit("connect");
        await chatClient.connect();

        mockedSocketIo.server.mockOn("joinRoom", (username, room, callback) => {
          callback(true);
        });

        await chatClient.joinRoom("testuser", "general");

        // Setup message handler
        mockedSocketIo.server.mockOn("sendMessage", (message, callback) => {
          expect(message).toBe("Hello, world!");
          callback(true);
        });

        const result = await chatClient.sendMessage("Hello, world!");
        expect(result).toBe(true);
      },
    );

    itWithMocketioClient(
      "should fail to send message when not in a room",
      async ({ mockedSocketIo }) => {
        chatClient = new ChatRoomClient("http://localhost:9999");

        // Connect but don't join a room
        mockedSocketIo.server.mockEmit("connect");
        await chatClient.connect();

        const result = await chatClient.sendMessage("Hello, world!");
        expect(result).toBe(false);
      },
    );

    itWithMocketioClient(
      "should handle message failure from server",
      async ({ mockedSocketIo }) => {
        chatClient = new ChatRoomClient("http://localhost:9999");

        // Connect and join room
        mockedSocketIo.server.mockEmit("connect");
        await chatClient.connect();

        mockedSocketIo.server.mockOn("joinRoom", (username, room, callback) => {
          callback(true);
        });

        await chatClient.joinRoom("testuser", "general");

        // Setup message handler with failure
        mockedSocketIo.server.mockOn("sendMessage", (message, callback) => {
          callback(false);
        });

        const result = await chatClient.sendMessage("Hello, world!");
        expect(result).toBe(false);
      },
    );

    itWithMocketioClient(
      "should receive chat messages",
      async ({ mockedSocketIo }) => {
        chatClient = new ChatRoomClient("http://localhost:9999");

        // Connect and join room
        mockedSocketIo.server.mockEmit("connect");
        await chatClient.connect();

        mockedSocketIo.server.mockOn("joinRoom", (username, room, callback) => {
          callback(true);
        });

        await chatClient.joinRoom("testuser", "general");

        // Send a message from the server
        const testMessage: ChatMessage = {
          username: "otheruser",
          text: "Hello there!",
          room: "general",
          timestamp: Date.now(),
        };

        mockedSocketIo.server.mockEmit("chatMessage", testMessage);

        // Check if message was received
        expect(chatClient.messages).toHaveLength(1);
        expect(chatClient.messages[0]).toEqual(testMessage);

        // Send another message
        const testMessage2: ChatMessage = {
          username: "thirduser",
          text: "How are you?",
          room: "general",
          timestamp: Date.now(),
        };

        mockedSocketIo.server.mockEmit("chatMessage", testMessage2);

        // Check if both messages are there
        expect(chatClient.messages).toHaveLength(2);
        expect(chatClient.messages[1]).toEqual(testMessage2);
      },
    );
  });

  describe("User Management", () => {
    itWithMocketioClient(
      "should track users joining the room",
      async ({ mockedSocketIo }) => {
        chatClient = new ChatRoomClient("http://localhost:9999");

        // Connect and join room
        mockedSocketIo.server.mockEmit("connect");
        await chatClient.connect();

        mockedSocketIo.server.mockOn("joinRoom", (username, room, callback) => {
          callback(true);
        });

        await chatClient.joinRoom("testuser", "general");

        // Simulate other users joining
        mockedSocketIo.server.mockEmit("userJoined", "user2", 2);
        mockedSocketIo.server.mockEmit("userJoined", "user3", 3);

        // Should have both other users (not including self)
        expect(chatClient.users).toContain("user2");
        expect(chatClient.users).toContain("user3");
        expect(chatClient.users).toHaveLength(2);
      },
    );

    itWithMocketioClient(
      "should track users leaving the room",
      async ({ mockedSocketIo }) => {
        chatClient = new ChatRoomClient("http://localhost:9999");

        // Connect and join room
        mockedSocketIo.server.mockEmit("connect");
        await chatClient.connect();

        mockedSocketIo.server.mockOn("joinRoom", (username, room, callback) => {
          callback(true);
        });

        await chatClient.joinRoom("testuser", "general");

        // Set initial users via roomUsers event
        mockedSocketIo.server.mockEmit("roomUsers", [
          "testuser",
          "user2",
          "user3",
        ]);
        expect(chatClient.users).toEqual(["testuser", "user2", "user3"]);

        // Simulate user leaving
        mockedSocketIo.server.mockEmit("userLeft", "user2", 2);

        // Should have removed the user
        expect(chatClient.users).not.toContain("user2");
        expect(chatClient.users).toContain("testuser");
        expect(chatClient.users).toContain("user3");
        expect(chatClient.users).toHaveLength(2);
      },
    );

    itWithMocketioClient(
      "should handle room users update",
      async ({ mockedSocketIo }) => {
        chatClient = new ChatRoomClient("http://localhost:9999");

        // Connect and join room
        mockedSocketIo.server.mockEmit("connect");
        await chatClient.connect();

        mockedSocketIo.server.mockOn("joinRoom", (username, room, callback) => {
          callback(true);
        });

        await chatClient.joinRoom("testuser", "general");

        // Set users via roomUsers event
        const userList = ["testuser", "user2", "user3", "user4"];
        mockedSocketIo.server.mockEmit("roomUsers", userList);

        expect(chatClient.users).toEqual(userList);
      },
    );
  });

  describe("Typing Indicator", () => {
    itWithMocketioClient(
      "should send typing indicator",
      async ({ mockedSocketIo }) => {
        chatClient = new ChatRoomClient("http://localhost:9999");

        // Connect and join room
        mockedSocketIo.server.mockEmit("connect");
        await chatClient.connect();

        mockedSocketIo.server.mockOn("joinRoom", (username, room, callback) => {
          callback(true);
        });

        await chatClient.joinRoom("testuser", "general");

        // Setup typing handler to track calls
        const typingSpy = vi.fn();
        mockedSocketIo.server.mockOn("typing", typingSpy);

        // Test both true and false cases
        chatClient.setTyping(true);
        expect(typingSpy).toHaveBeenCalledWith(true);

        chatClient.setTyping(false);
        expect(typingSpy).toHaveBeenCalledWith(false);
      },
    );

    itWithMocketioClient(
      "should not send typing when not in room",
      async ({ mockedSocketIo }) => {
        chatClient = new ChatRoomClient("http://localhost:9999");

        // Connect but don't join room
        mockedSocketIo.server.mockEmit("connect");
        await chatClient.connect();

        // Setup typing handler to track calls
        const typingSpy = vi.fn();
        mockedSocketIo.server.mockOn("typing", typingSpy);

        chatClient.setTyping(true);
        expect(typingSpy).not.toHaveBeenCalled();
      },
    );
  });

  describe("Error Handling", () => {
    itWithMocketioClient(
      "should handle server errors",
      async ({ mockedSocketIo }) => {
        chatClient = new ChatRoomClient("http://localhost:9999");

        // Connect
        mockedSocketIo.server.mockEmit("connect");
        await chatClient.connect();

        // Mock console.error to track it's called
        const errorSpy = vi.spyOn(console, "error");

        // Send error from server
        mockedSocketIo.server.mockEmit("error", "Invalid operation");

        // Should have logged the error
        expect(errorSpy).toHaveBeenCalledWith(
          expect.stringContaining("Invalid operation"),
        );
      },
    );
  });

  describe("Edge Cases", () => {
    itWithMocketioClient(
      "should handle multiple connects without issue",
      async ({ mockedSocketIo }) => {
        chatClient = new ChatRoomClient("http://localhost:9999");

        // Connect once
        mockedSocketIo.server.mockEmit("connect");
        await chatClient.connect();
        expect(chatClient.isConnected).toBe(true);

        const result = await chatClient.connect();

        expect(result).toBe(true);
      },
    );

    itWithMocketioClient(
      "should not add current user to users list when joining",
      async ({ mockedSocketIo }) => {
        chatClient = new ChatRoomClient("http://localhost:9999");

        // Connect
        mockedSocketIo.server.mockEmit("connect");
        await chatClient.connect();

        // Setup join handler
        mockedSocketIo.server.mockOn("joinRoom", (username, room, callback) => {
          callback(true);
        });

        // Join the room
        await chatClient.joinRoom("testuser", "general");

        // Simulate userJoined event for self
        mockedSocketIo.server.mockEmit("userJoined", "testuser", 1);

        // Users list should not include self from userJoined event
        expect(chatClient.users).toEqual([]);
      },
    );

    itWithMocketioClient(
      "should handle empty room names",
      async ({ mockedSocketIo }) => {
        chatClient = new ChatRoomClient("http://localhost:9999");

        // Connect
        mockedSocketIo.server.mockEmit("connect");
        await chatClient.connect();

        mockedSocketIo.server.mockOn("joinRoom", (username, room, callback) => {
          expect(room).toBe("");
          callback(true);
        });

        // Try to join with empty room name
        const result = await chatClient.joinRoom("testuser", "");
        expect(result).toBe(true);
      },
    );

    itWithMocketioClient(
      "should handle empty messages",
      async ({ mockedSocketIo }) => {
        chatClient = new ChatRoomClient("http://localhost:9999");

        // Connect and join room
        mockedSocketIo.server.mockEmit("connect");
        await chatClient.connect();

        mockedSocketIo.server.mockOn("joinRoom", (username, room, callback) => {
          callback(true);
        });

        await chatClient.joinRoom("testuser", "general");

        // Setup message handler to verify empty message
        mockedSocketIo.server.mockOn("sendMessage", (message, callback) => {
          expect(message).toBe("");
          callback(true);
        });

        const result = await chatClient.sendMessage("");
        expect(result).toBe(true);
      },
    );
  });
});
