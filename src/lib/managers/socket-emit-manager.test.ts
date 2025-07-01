import { describe, it, expect, beforeEach, vi, afterEach } from "vitest";
import { SocketEmitManager } from "./socket-emit-manager";
import { SocketEventTarget } from "../target/socket-event-target";
import { SocketAttributes } from "./socket-attribute-manager";

describe("SocketEmitManager", () => {
  let clientEventTarget: SocketEventTarget;
  let serverEventTarget: SocketEventTarget;
  let clientSocketAttributes: SocketAttributes;
  let socketEmitManager: SocketEmitManager;

  beforeEach(() => {
    clientEventTarget = new SocketEventTarget();
    serverEventTarget = new SocketEventTarget();
    clientSocketAttributes = {
      connected: false,
      disconnected: false,
      id: "",
      active: false,
      recovered: false,
      io: undefined as any,
    };
    socketEmitManager = new SocketEmitManager(
      clientEventTarget,
      serverEventTarget,
      clientSocketAttributes,
    );
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe("emitFromClient - Argument Handling Edge Cases", () => {
    it("should handle no arguments", () => {
      const mockHandler = vi.fn();
      serverEventTarget.addEventListener("test-event", (event: Event) => {
        if (event instanceof CustomEvent) {
          mockHandler(event.detail);
        }
      });

      socketEmitManager.emitFromClient("test-event");
      expect(mockHandler).toHaveBeenCalledWith(null);
    });

    it("should handle single string argument", () => {
      const mockHandler = vi.fn();
      serverEventTarget.addEventListener("test-event", (event: Event) => {
        if (event instanceof CustomEvent) {
          mockHandler(event.detail);
        }
      });

      socketEmitManager.emitFromClient("test-event", "single-string");
      expect(mockHandler).toHaveBeenCalledWith("single-string");
    });

    it("should handle single array argument (should NOT be spread)", () => {
      const mockHandler = vi.fn();
      serverEventTarget.addEventListener("test-event", (event: Event) => {
        if (event instanceof CustomEvent) {
          mockHandler(event.detail);
        }
      });

      const singleArray = ["item1", "item2", "item3"];
      socketEmitManager.emitFromClient("test-event", singleArray);
      expect(mockHandler).toHaveBeenCalledWith(singleArray);
    });

    it("should handle multiple arguments (should be marked for spreading)", () => {
      const mockHandler = vi.fn();
      serverEventTarget.addEventListener("test-event", (event: Event) => {
        if (event instanceof CustomEvent) {
          mockHandler(event.detail);
        }
      });

      socketEmitManager.emitFromClient("test-event", "arg1", "arg2", "arg3");
      expect(mockHandler).toHaveBeenCalledWith({
        _spreadArgs: true,
        args: ["arg1", "arg2", "arg3"],
      });
    });

    it("should handle single object argument", () => {
      const mockHandler = vi.fn();
      serverEventTarget.addEventListener("test-event", (event: Event) => {
        if (event instanceof CustomEvent) {
          mockHandler(event.detail);
        }
      });

      const singleObject = { name: "test", data: [1, 2, 3] };
      socketEmitManager.emitFromClient("test-event", singleObject);
      expect(mockHandler).toHaveBeenCalledWith(singleObject);
    });

    it("should handle single null/undefined arguments", () => {
      const mockHandler = vi.fn();

      serverEventTarget.addEventListener("test-event", (event: Event) => {
        if (event instanceof CustomEvent) {
          mockHandler(event.detail);
        }
      });

      socketEmitManager.emitFromClient("test-event", null);
      socketEmitManager.emitFromClient("test-event", undefined);

      expect(mockHandler).toHaveBeenNthCalledWith(1, null);
      expect(mockHandler).toHaveBeenNthCalledWith(2, null);
    });

    it("should handle mixed argument types", () => {
      const mockHandler = vi.fn();
      serverEventTarget.addEventListener("test-event", (event: Event) => {
        if (event instanceof CustomEvent) {
          mockHandler(event.detail);
        }
      });

      socketEmitManager.emitFromClient(
        "test-event",
        "string",
        123,
        { key: "value" },
        [1, 2, 3],
      );
      expect(mockHandler).toHaveBeenCalledWith({
        _spreadArgs: true,
        args: ["string", 123, { key: "value" }, [1, 2, 3]],
      });
    });
  });

  describe("emitFromServer - Argument Handling Edge Cases", () => {
    it("should handle single array argument from server", () => {
      const mockHandler = vi.fn();
      clientEventTarget.addEventListener("server-event", (event: Event) => {
        if (event instanceof CustomEvent) {
          mockHandler(event.detail);
        }
      });

      const userArray = ["user1", "user2", "user3"];
      socketEmitManager.emitFromServer("server-event", userArray);
      expect(mockHandler).toHaveBeenCalledWith(userArray);
    });

    it("should handle multiple arguments from server", () => {
      const mockHandler = vi.fn();
      clientEventTarget.addEventListener("server-event", (event: Event) => {
        if (event instanceof CustomEvent) {
          mockHandler(event.detail);
        }
      });

      socketEmitManager.emitFromServer("server-event", "arg1", "arg2", "arg3");
      expect(mockHandler).toHaveBeenCalledWith({
        _spreadArgs: true,
        args: ["arg1", "arg2", "arg3"],
      });
    });

    it("should handle no arguments from server", () => {
      const mockHandler = vi.fn();
      clientEventTarget.addEventListener("server-event", (event: Event) => {
        if (event instanceof CustomEvent) {
          mockHandler(event.detail);
        }
      });

      socketEmitManager.emitFromServer("server-event");
      expect(mockHandler).toHaveBeenCalledWith(null);
    });
  });

  describe("serverOn - Regular Event Handling Edge Cases", () => {
    it("should handle single array argument correctly", () => {
      const handlerSpy = vi.fn();
      socketEmitManager.serverOn("array-event", handlerSpy);

      const testArray = ["user1", "user2", "user3"];
      socketEmitManager.emitFromClient("array-event", testArray);

      expect(handlerSpy).toHaveBeenCalledWith(testArray);
      expect(handlerSpy).toHaveBeenCalledTimes(1);
    });

    it("should handle multiple arguments with spreading", () => {
      const handlerSpy = vi.fn();
      socketEmitManager.serverOn("multi-event", handlerSpy);

      socketEmitManager.emitFromClient("multi-event", "arg1", "arg2", "arg3");

      expect(handlerSpy).toHaveBeenCalledWith("arg1", "arg2", "arg3");
      expect(handlerSpy).toHaveBeenCalledTimes(1);
    });

    it("should handle no arguments", () => {
      const handlerSpy = vi.fn();
      socketEmitManager.serverOn("no-args-event", handlerSpy);

      socketEmitManager.emitFromClient("no-args-event");

      expect(handlerSpy).toHaveBeenCalledWith(null);
      expect(handlerSpy).toHaveBeenCalledTimes(1);
    });

    it("should handle single primitive arguments", () => {
      const handlerSpy = vi.fn();
      socketEmitManager.serverOn("primitive-event", handlerSpy);

      socketEmitManager.emitFromClient("primitive-event", "test-string");
      socketEmitManager.emitFromClient("primitive-event", 42);
      socketEmitManager.emitFromClient("primitive-event", true);
      socketEmitManager.emitFromClient("primitive-event", null);

      expect(handlerSpy).toHaveBeenNthCalledWith(1, "test-string");
      expect(handlerSpy).toHaveBeenNthCalledWith(2, 42);
      expect(handlerSpy).toHaveBeenNthCalledWith(3, true);
      expect(handlerSpy).toHaveBeenNthCalledWith(4, null);
    });

    it("should handle complex nested objects", () => {
      const handlerSpy = vi.fn();
      socketEmitManager.serverOn("complex-event", handlerSpy);

      const complexObject = {
        users: ["user1", "user2"],
        metadata: { timestamp: Date.now(), version: "1.0" },
        nested: { deep: { value: [1, 2, 3] } },
      };

      socketEmitManager.emitFromClient("complex-event", complexObject);

      expect(handlerSpy).toHaveBeenCalledWith(complexObject);
    });
  });

  describe("serverOn - Acknowledgment Event Handling Edge Cases", () => {
    it("should handle ack with single array argument", () => {
      return new Promise<void>((done) => {
        socketEmitManager.serverOn("ack-array", (data, callback) => {
          expect(Array.isArray(data)).toBe(true);
          expect(data).toEqual(["item1", "item2", "item3"]);
          callback("array-response");
        });

        socketEmitManager.emitFromClient(
          "ack-array",
          ["item1", "item2", "item3"],
          (response: any) => {
            expect(response).toBe("array-response");
            done();
          },
        );
      });
    });

    it("should handle ack with multiple arguments", () => {
      return new Promise<void>((done) => {
        socketEmitManager.serverOn(
          "ack-multi",
          (arg1, arg2, arg3, callback) => {
            expect(arg1).toBe("first");
            expect(arg2).toBe("second");
            expect(arg3).toBe("third");
            callback("multi-response");
          },
        );

        socketEmitManager.emitFromClient(
          "ack-multi",
          "first",
          "second",
          "third",
          (response: any) => {
            expect(response).toBe("multi-response");
            done();
          },
        );
      });
    });

    it("should handle ack with no arguments", () => {
      return new Promise<void>((done) => {
        socketEmitManager.serverOn("ack-empty", (callback) => {
          expect(callback).toBeInstanceOf(Function);
          callback("empty-response");
        });

        socketEmitManager.emitFromClient("ack-empty", (response: any) => {
          expect(response).toBe("empty-response");
          done();
        });
      });
    });

    it("should handle ack callback with multiple return values", () => {
      return new Promise<void>((done) => {
        socketEmitManager.serverOn("ack-multi-return", (data, callback) => {
          expect(data).toBe("request");
          callback("response1", "response2", "response3");
        });

        socketEmitManager.emitFromClient(
          "ack-multi-return",
          "request",
          (...responses: any[]) => {
            expect(responses).toEqual(["response1", "response2", "response3"]);
            done();
          },
        );
      });
    });

    it("should handle ack callback with array return value", () => {
      return new Promise<void>((done) => {
        socketEmitManager.serverOn("ack-array-return", (data, callback) => {
          expect(data).toBe("request");
          callback(["response1", "response2", "response3"]);
        });

        socketEmitManager.emitFromClient(
          "ack-array-return",
          "request",
          (response: any) => {
            expect(response).toEqual(["response1", "response2", "response3"]);
            done();
          },
        );
      });
    });

    it("should handle ack with mixed argument types", () => {
      return new Promise<void>((done) => {
        socketEmitManager.serverOn(
          "ack-mixed",
          (str, num, obj, arr, callback) => {
            expect(str).toBe("string");
            expect(num).toBe(42);
            expect(obj).toEqual({ key: "value" });
            expect(arr).toEqual([1, 2, 3]);
            callback("mixed-response");
          },
        );

        socketEmitManager.emitFromClient(
          "ack-mixed",
          "string",
          42,
          { key: "value" },
          [1, 2, 3],
          (response: any) => {
            expect(response).toBe("mixed-response");
            done();
          },
        );
      });
    });
  });

  describe("emitFromClientWithAck - Promise-based acknowledgments", () => {
    it("should handle promise ack with single array", async () => {
      socketEmitManager.serverOn("promise-array", (data, callback) => {
        expect(Array.isArray(data)).toBe(true);
        callback(data.reverse());
      });

      const response = await socketEmitManager.emitFromClientWithAck(
        "promise-array",
        ["a", "b", "c"],
      );
      expect(response).toEqual(["c", "b", "a"]);
    });

    it("should handle promise ack with multiple arguments", async () => {
      socketEmitManager.serverOn("promise-multi", (arg1, arg2, callback) => {
        callback(`${arg1}-${arg2}`);
      });

      const response = await socketEmitManager.emitFromClientWithAck(
        "promise-multi",
        "hello",
        "world",
      );
      expect(response).toBe("hello-world");
    });

    it("should handle promise ack with multiple return values", async () => {
      socketEmitManager.serverOn("promise-multi-return", (data, callback) => {
        callback("first", "second", "third");
      });

      const response = await socketEmitManager.emitFromClientWithAck(
        "promise-multi-return",
        "request",
      );
      expect(response).toEqual(["first", "second", "third"]);
    });
  });

  describe("send method edge cases", () => {
    it("should handle send with single array", () => {
      const mockHandler = vi.fn();
      serverEventTarget.addEventListener("message", (event: Event) => {
        if (event instanceof CustomEvent) {
          mockHandler(event.detail);
        }
      });

      socketEmitManager.send(["msg1", "msg2", "msg3"]);
      expect(mockHandler).toHaveBeenCalledWith(["msg1", "msg2", "msg3"]);
    });

    it("should handle send with multiple arguments", () => {
      const mockHandler = vi.fn();
      serverEventTarget.addEventListener("message", (event: Event) => {
        if (event instanceof CustomEvent) {
          mockHandler(event.detail);
        }
      });

      socketEmitManager.send("msg1", "msg2", "msg3");
      expect(mockHandler).toHaveBeenCalledWith({
        _spreadArgs: true,
        args: ["msg1", "msg2", "msg3"],
      });
    });

    it("should handle send with acknowledgment", () => {
      return new Promise<void>((done) => {
        socketEmitManager.serverOn("message", (data, callback) => {
          expect(data).toBe("hello");
          callback("message received");
        });

        socketEmitManager.send("hello", (response: any) => {
          expect(response).toBe("message received");
          done();
        });
      });
    });
  });

  describe("Reserved server events", () => {
    it("should handle connect event", () => {
      socketEmitManager.emitFromServer("connect");

      expect(clientSocketAttributes.connected).toBe(true);
      expect(clientSocketAttributes.disconnected).toBe(false);
      expect(clientSocketAttributes.id).toBeTruthy();
    });

    it("should handle disconnect event", () => {
      socketEmitManager.emitFromServer("disconnect");

      expect(clientSocketAttributes.connected).toBe(false);
      expect(clientSocketAttributes.disconnected).toBe(true);
    });

    it("should handle connect_error event", () => {
      const originalConnected = clientSocketAttributes.connected;
      const originalDisconnected = clientSocketAttributes.disconnected;

      socketEmitManager.emitFromServer("connect_error");

      expect(clientSocketAttributes.connected).toBe(originalConnected);
      expect(clientSocketAttributes.disconnected).toBe(originalDisconnected);
    });
  });

  describe("Edge cases with special characters and objects", () => {
    it("should handle objects with _spreadArgs property", () => {
      const handlerSpy = vi.fn();
      socketEmitManager.serverOn("special-object", handlerSpy);

      const specialObject = { _spreadArgs: false, data: "test" };
      socketEmitManager.emitFromClient("special-object", specialObject);

      expect(handlerSpy).toHaveBeenCalledWith(specialObject);
    });

    it("should handle arrays containing objects with _spreadArgs", () => {
      const handlerSpy = vi.fn();
      socketEmitManager.serverOn("array-with-special", handlerSpy);

      const arrayWithSpecial = [{ _spreadArgs: true }, "normal", 123];
      socketEmitManager.emitFromClient("array-with-special", arrayWithSpecial);

      expect(handlerSpy).toHaveBeenCalledWith(arrayWithSpecial);
    });

    it("should handle deeply nested arrays", () => {
      const handlerSpy = vi.fn();
      socketEmitManager.serverOn("nested-arrays", handlerSpy);

      const nestedArray = [[[["deep"]], ["nested"]], [["arrays"]]];
      socketEmitManager.emitFromClient("nested-arrays", nestedArray);

      expect(handlerSpy).toHaveBeenCalledWith(nestedArray);
    });
  });

  describe("Concurrent acknowledgments", () => {
    it("should handle multiple concurrent acknowledgments", async () => {
      socketEmitManager.serverOn("concurrent", (id, callback) => {
        setTimeout(() => callback(`response-${id}`), Math.random() * 10);
      });

      const promises = Array.from({ length: 5 }, (_, i) =>
        socketEmitManager.emitFromClientWithAck("concurrent", `request-${i}`),
      );

      const responses = await Promise.all(promises);

      responses.forEach((response, index) => {
        expect(response).toBe(`response-request-${index}`);
      });
    });
  });
});
