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

    // Silence console logs during tests
    vi.spyOn(console, "log").mockImplementation(() => {});
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe("emitFromClient", () => {
    it("should emit regular events without acknowledgment", () => {
      // Setup a listener on the server
      const mockHandler = vi.fn();
      serverEventTarget.addEventListener("test-event", (event: Event) => {
        if (event instanceof CustomEvent) {
          mockHandler(event.detail);
        }
      });

      // Emit event from client
      socketEmitManager.emitFromClient("test-event", "data1", "data2");

      // Check that the server received the event with correct data
      expect(mockHandler).toHaveBeenCalledTimes(1);
      expect(mockHandler).toHaveBeenCalledWith(["data1", "data2"]);
    });

    it("should emit events with single argument correctly", () => {
      const mockHandler = vi.fn();
      serverEventTarget.addEventListener("test-event", (event: Event) => {
        if (event instanceof CustomEvent) {
          mockHandler(event.detail);
        }
      });

      // Emit event from client with a single argument
      socketEmitManager.emitFromClient("test-event", "single-data");

      // The detail should be the single value, not wrapped in an array
      expect(mockHandler).toHaveBeenCalledTimes(1);
      expect(mockHandler).toHaveBeenCalledWith("single-data");
    });

    it("should emit empty events correctly", () => {
      const mockHandler = vi.fn();
      serverEventTarget.addEventListener("test-event", (event: Event) => {
        if (event instanceof CustomEvent) {
          mockHandler(event.detail);
        }
      });

      // Emit event from client with no arguments
      socketEmitManager.emitFromClient("test-event");

      // The detail should be undefined for empty args
      expect(mockHandler).toHaveBeenCalledTimes(1);
      expect(mockHandler).toHaveBeenCalledWith(null);
    });

    it("should handle acknowledgments correctly", () => {
      return new Promise<void>((resolve) => {
        // Setup a server mock that will respond to acknowledgments
        socketEmitManager.serverOn("ack-test", (data, callback) => {
          expect(data).toBe("request-data");
          callback("response-data");
        });

        // Emit event from client with acknowledgment
        socketEmitManager.emitFromClient(
          "ack-test",
          "request-data",
          (response: any) => {
            // This callback should be called when the server responds
            expect(response).toBe("response-data");
            resolve();
          },
        );
      });
    });

    it("should handle multiple callback arguments", () => {
      return new Promise<void>((done) => {
        // Setup a server mock that responds with multiple arguments
        socketEmitManager.serverOn("multi-ack", (data, callback) => {
          expect(data).toBe("request");
          callback("response1", "response2", "response3");
        });

        // Emit with acknowledgment expecting multiple responses
        socketEmitManager.emitFromClient(
          "multi-ack",
          "request",
          (...responses: any[]) => {
            expect(responses).toEqual(["response1", "response2", "response3"]);
            done();
          },
        );
      });
    });
  });

  describe("emitFromClientWithAck", () => {
    it("should return a promise that resolves with the response", async () => {
      // Setup server handler
      socketEmitManager.serverOn("promise-test", (data, callback) => {
        expect(data).toBe("promise-request");
        callback("promise-response");
      });

      // Use the promisified version
      const response = await socketEmitManager.emitFromClientWithAck(
        "promise-test",
        "promise-request",
      );
      expect(response).toBe("promise-response");
    });

    it("should handle multiple response arguments", async () => {
      socketEmitManager.serverOn("multi-promise", (data, callback) => {
        callback("res1", "res2", "res3");
      });

      const response = await socketEmitManager.emitFromClientWithAck(
        "multi-promise",
        "data",
      );
      expect(response).toEqual(["res1", "res2", "res3"]);
    });

    it("should call both the promise and the callback if provided", () => {
      return new Promise<void>((done) => {
        const callbackSpy = vi.fn();

        socketEmitManager.serverOn("dual-callback", (data, callback) => {
          callback("dual-response");
        });

        socketEmitManager
          .emitFromClientWithAck("dual-callback", "data", callbackSpy)
          .then((response) => {
            expect(response).toBe("dual-response");
            expect(callbackSpy).toHaveBeenCalledWith("dual-response");
            done();
          });
      });
    });
  });

  describe("send", () => {
    it("should emit a message event", () => {
      const mockHandler = vi.fn();
      serverEventTarget.addEventListener("message", (event: Event) => {
        if (event instanceof CustomEvent) {
          mockHandler(event.detail);
        }
      });

      socketEmitManager.send("hello");
      expect(mockHandler).toHaveBeenCalledWith("hello");
    });

    it("should support acknowledgments", () => {
      return new Promise<void>((done) => {
        socketEmitManager.serverOn("message", (data, callback) => {
          expect(data).toBe("msg-with-ack");
          callback("message-received");
        });

        socketEmitManager.send("msg-with-ack", (response: string) => {
          expect(response).toBe("message-received");
          done();
        });
      });
    });
  });

  describe("emitFromServer", () => {
    it("should emit custom events to the client", () => {
      const mockHandler = vi.fn();
      clientEventTarget.addEventListener("server-event", (event: Event) => {
        if (event instanceof CustomEvent) {
          mockHandler(event.detail);
        }
      });

      socketEmitManager.emitFromServer("server-event", "server-data");
      expect(mockHandler).toHaveBeenCalledWith("server-data");
    });

    it("should handle reserved connect event", () => {
      socketEmitManager.emitFromServer("connect");
      expect(clientSocketAttributes.connected).toBe(true);
      expect(clientSocketAttributes.disconnected).toBe(false);
      expect(clientSocketAttributes.id).toBeTruthy();
    });

    it("should handle reserved disconnect event", () => {
      socketEmitManager.emitFromServer("disconnect");
      expect(clientSocketAttributes.connected).toBe(false);
      expect(clientSocketAttributes.disconnected).toBe(true);
    });
  });

  describe("serverOn", () => {
    it("should handle regular events from client", () => {
      const handlerSpy = vi.fn();
      socketEmitManager.serverOn("client-event", handlerSpy);

      socketEmitManager.emitFromClient("client-event", "client-data");
      expect(handlerSpy).toHaveBeenCalledWith("client-data");
    });

    it("should handle events with multiple arguments", () => {
      const handlerSpy = vi.fn();
      socketEmitManager.serverOn("multi-arg", handlerSpy);

      socketEmitManager.emitFromClient("multi-arg", "arg1", "arg2", "arg3");
      expect(handlerSpy).toHaveBeenCalledWith("arg1", "arg2", "arg3");
    });

    it("should properly handle acknowledgment events", () => {
      return new Promise<void>((done) => {
        const handlerSpy = vi.fn((data, callback) => {
          expect(data).toBe("ack-data");
          callback("ack-response");
        });

        socketEmitManager.serverOn("ack-event", handlerSpy);

        socketEmitManager.emitFromClient(
          "ack-event",
          "ack-data",
          (response: any) => {
            expect(response).toBe("ack-response");
            expect(handlerSpy).toHaveBeenCalled();
            done();
          },
        );
      });
    });

    it("should support multiple acknowledgment callbacks", () => {
      return new Promise<void>((done) => {
        socketEmitManager.serverOn("multi-ack-cb", (data, callback) => {
          callback("resp1", "resp2");
        });

        socketEmitManager.emitFromClient(
          "multi-ack-cb",
          "data",
          (r1: string, r2: string) => {
            expect(r1).toBe("resp1");
            expect(r2).toBe("resp2");
            done();
          },
        );
      });
    });
  });
});
