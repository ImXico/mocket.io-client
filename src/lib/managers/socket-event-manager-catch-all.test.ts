import { describe, it, expect, vi, beforeEach } from "vitest";
import { SocketEventManagerCatchAll } from "./socket-event-manager-catch-all";
import { SocketEventTarget } from "../target/socket-event-target";

describe("SocketEventManagerCatchAll", () => {
  let clientEventTarget: SocketEventTarget;
  let serverEventTarget: SocketEventTarget;
  let manager: SocketEventManagerCatchAll;

  beforeEach(() => {
    clientEventTarget = new SocketEventTarget();
    serverEventTarget = new SocketEventTarget();
    manager = new SocketEventManagerCatchAll(
      clientEventTarget,
      serverEventTarget,
    );
  });

  describe("Incoming events (server to client)", () => {
    it("should register anyIncoming handlers", () => {
      const handler = vi.fn();

      const onAnyIncomingResult = manager.onAnyIncoming(handler);
      expect(onAnyIncomingResult).toBe(clientEventTarget);

      // Simulate incoming event from server
      const event = new CustomEvent("server-event", { detail: ["event-data"] });
      clientEventTarget.dispatchEvent(event);

      expect(handler).toHaveBeenCalledWith("server-event", "event-data");
    });

    it("should support prependAnyIncoming to add handlers to the beginning", () => {
      const firstHandler = vi.fn(() => {
        // Ensure first handler runs first
        expect(secondHandler).not.toHaveBeenCalled();
      });

      const secondHandler = vi.fn();

      manager.onAnyIncoming(secondHandler);
      manager.prependAnyIncoming(firstHandler);

      const event = new CustomEvent("test-event", { detail: ["data"] });
      clientEventTarget.dispatchEvent(event);

      expect(firstHandler).toHaveBeenCalled();
      expect(secondHandler).toHaveBeenCalled();
    });

    it("should remove anyIncoming handlers", () => {
      const handler = vi.fn();

      manager.onAnyIncoming(handler);
      manager.offAnyIncoming(handler);

      const event = new CustomEvent("test-event", { detail: ["data"] });
      clientEventTarget.dispatchEvent(event);

      expect(handler).not.toHaveBeenCalled();
    });

    it("should return all anyIncoming listeners", () => {
      const handler1 = vi.fn();
      const handler2 = vi.fn();

      manager.onAnyIncoming(handler1);
      manager.onAnyIncoming(handler2);

      const listeners = manager.listenersAnyIncoming();
      expect(listeners.length).toBe(2);
      expect(listeners).toContain(handler1);
      expect(listeners).toContain(handler2);
    });
  });

  describe("Outgoing events (client to server)", () => {
    it("should register anyOutgoing handlers", () => {
      const handler = vi.fn();

      manager.onAnyOutgoing(handler);

      // Simulate outgoing event from client
      const event = new CustomEvent("client-event", { detail: ["event-data"] });
      serverEventTarget.dispatchEvent(event);

      expect(handler).toHaveBeenCalledWith("client-event", "event-data");
    });

    it("should support prependAnyOutgoing to add handlers to the beginning", () => {
      const firstHandler = vi.fn(() => {
        // Ensure first handler runs first
        expect(secondHandler).not.toHaveBeenCalled();
      });

      const secondHandler = vi.fn();

      manager.onAnyOutgoing(secondHandler);
      manager.prependAnyOutgoing(firstHandler);

      const event = new CustomEvent("test-event", { detail: ["data"] });
      serverEventTarget.dispatchEvent(event);

      expect(firstHandler).toHaveBeenCalled();
      expect(secondHandler).toHaveBeenCalled();
    });

    it("should remove anyOutgoing handlers", () => {
      const handler = vi.fn();

      manager.onAnyOutgoing(handler);
      manager.offAnyOutgoing(handler);

      const event = new CustomEvent("test-event", { detail: ["data"] });
      serverEventTarget.dispatchEvent(event);

      expect(handler).not.toHaveBeenCalled();
    });

    it("should return all anyOutgoing listeners", () => {
      const handler1 = vi.fn();
      const handler2 = vi.fn();

      manager.onAnyOutgoing(handler1);
      manager.onAnyOutgoing(handler2);

      const listeners = manager.listenersAnyOutgoing();
      expect(listeners.length).toBe(2);
      expect(listeners).toContain(handler1);
      expect(listeners).toContain(handler2);
    });
  });
});
