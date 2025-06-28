import { describe, it, expect, vi, beforeEach } from "vitest";
import { SocketEmitManager } from "./socket-emit-manager";
import { SocketEventTarget } from "../target/socket-event-target";
import { isCustomEvent } from "../util";

describe("SocketEmitManager", () => {
  let clientEventTarget: SocketEventTarget;
  let serverEventTarget: SocketEventTarget;
  let manager: SocketEmitManager;
  let clientSocketAttributes: any;

  beforeEach(() => {
    clientEventTarget = new SocketEventTarget();
    serverEventTarget = new SocketEventTarget();
    clientSocketAttributes = {
      connected: false,
      disconnected: false,
      id: null,
    };
    manager = new SocketEmitManager(
      clientEventTarget,
      serverEventTarget,
      clientSocketAttributes,
    );
  });

  describe("emitFromClient", () => {
    it("should emit events from client to server", () => {
      const serverListener = vi.fn();
      serverEventTarget.addEventListener("test-event", serverListener);

      const result = manager.emitFromClient("test-event", "hello", 123);

      expect(result).toBe(clientEventTarget);
      expect(serverListener).toHaveBeenCalledTimes(1);

      const event = serverListener.mock.calls[0][0];
      expect(isCustomEvent(event)).toBe(true);
      expect(event.type).toBe("test-event");
      expect(event.detail).toEqual(["hello", 123]);
    });

    it("should support callback-based acknowledgments", () => {
      const callback = vi.fn();
      const acknowledgeResponse = "acknowledged";

      // Add a listener to simulate server processing and acknowledgment
      serverEventTarget.addEventListener("test-event-ack", (event) => {
        if (isCustomEvent(event) && event.detail && event.detail.ackId) {
          manager.acknowledgeClientEvent(
            "promise-ack-event",
            event.detail.ackId,
            acknowledgeResponse,
          );
        }
      });

      manager.emitFromClient("test-event-ack", "data", callback);

      // Wait for the next tick to allow promises to resolve
      setTimeout(() => {
        expect(callback).toHaveBeenCalledWith(acknowledgeResponse);
      }, 0);
    });
  });

  describe("emitFromClientWithAck", () => {
    it("should return a promise that resolves with acknowledgment data", async () => {
      const acknowledgeResponse = { status: "success", data: "test" };

      // Add a listener to simulate server processing and acknowledgment
      serverEventTarget.addEventListener("promise-ack-event", (event) => {
        if (isCustomEvent(event) && event.detail && event.detail.ackId) {
          manager.acknowledgeClientEvent(
            "promise-ack-event",
            event.detail.ackId,
            acknowledgeResponse,
          );
        }
      });

      const result = await manager.emitFromClientWithAck(
        "promise-ack-event",
        "data",
      );

      expect(result).toEqual(acknowledgeResponse);
    });
  });

  describe("send", () => {
    it("should emit a 'message' event", () => {
      const serverListener = vi.fn();
      serverEventTarget.addEventListener("message", serverListener);

      manager.send("hello");

      expect(serverListener).toHaveBeenCalledTimes(1);
      const event = serverListener.mock.calls[0][0];
      expect(event.detail).toEqual(["hello"]);
    });

    it("should support acknowledgments", () => {
      const callback = vi.fn();
      const acknowledgeResponse = "message-ack";

      // Add a listener to simulate server processing and acknowledgment
      serverEventTarget.addEventListener("message", (event) => {
        if (isCustomEvent(event) && event.detail && event.detail.ackId) {
          manager.acknowledgeClientEvent(
            "promise-ack-event",
            event.detail.ackId,
            acknowledgeResponse,
          );
        }
      });

      manager.send("hello", callback);

      // Wait for the next tick to allow promises to resolve
      setTimeout(() => {
        expect(callback).toHaveBeenCalledWith(acknowledgeResponse);
      }, 0);
    });
  });

  describe("emitFromServer", () => {
    it("should emit custom events from server to client", () => {
      const clientListener = vi.fn();
      clientEventTarget.addEventListener("server-event", clientListener);

      manager.emitFromServer("server-event", "server-data", 456);

      expect(clientListener).toHaveBeenCalledTimes(1);
      const event = clientListener.mock.calls[0][0];
      expect(isCustomEvent(event)).toBe(true);
      expect(event.type).toBe("server-event");
      expect(event.detail).toEqual(["server-data", 456]);
    });

    it("should handle reserved 'connect' event", () => {
      const connectListener = vi.fn();
      clientEventTarget.addEventListener("connect", connectListener);

      manager.emitFromServer("connect");

      expect(connectListener).toHaveBeenCalledTimes(1);
      expect(clientSocketAttributes.connected).toBe(true);
      expect(clientSocketAttributes.disconnected).toBe(false);
      expect(clientSocketAttributes.id).toBeTruthy(); // Should have assigned an ID
    });

    it("should handle reserved 'disconnect' event", () => {
      // First connect
      manager.emitFromServer("connect");

      const disconnectListener = vi.fn();
      clientEventTarget.addEventListener("disconnect", disconnectListener);

      manager.emitFromServer("disconnect");

      expect(disconnectListener).toHaveBeenCalledTimes(1);
      expect(clientSocketAttributes.connected).toBe(false);
      expect(clientSocketAttributes.disconnected).toBe(true);
      // ID should be preserved even after disconnect
      expect(clientSocketAttributes.id).toBeTruthy();
    });
  });

  describe("acknowledgeClientEvent", () => {
    it("should dispatch an event with the provided response", () => {
      const eventKey = "test-event";
      const ackId = "test-ack-id";
      const response = { success: true };
      const serverListener = vi.fn();

      serverEventTarget.addEventListener(eventKey, serverListener);

      manager.acknowledgeClientEvent(eventKey, ackId, response);

      expect(serverListener).toHaveBeenCalledTimes(1);
      const event = serverListener.mock.calls[0][0];
      expect(isCustomEvent(event)).toBe(true);
      expect(event.detail).toEqual(response);
    });
  });
});
