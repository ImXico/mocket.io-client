import { describe, it, expect, beforeEach, vi, afterEach } from "vitest";
import { SocketEventManagerCatchAll } from "./socket-event-manager-catch-all";
import { SocketEventTarget } from "../target/socket-event-target";

describe("SocketEventManagerCatchAll", () => {
  let clientEventTarget: SocketEventTarget;
  let serverEventTarget: SocketEventTarget;
  let catchAllManager: SocketEventManagerCatchAll;

  beforeEach(() => {
    clientEventTarget = new SocketEventTarget();
    serverEventTarget = new SocketEventTarget();
    catchAllManager = new SocketEventManagerCatchAll(
      clientEventTarget,
      serverEventTarget,
    );
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe("onAnyIncoming", () => {
    it("should catch all incoming events with single arguments", () => {
      const handler = vi.fn();
      catchAllManager.onAnyIncoming(handler);

      // Dispatch various events with single arguments
      clientEventTarget.dispatchEvent(
        new CustomEvent("event1", { detail: "data1" }),
      );
      clientEventTarget.dispatchEvent(
        new CustomEvent("event2", { detail: 123 }),
      );
      clientEventTarget.dispatchEvent(
        new CustomEvent("event3", { detail: true }),
      );

      expect(handler).toHaveBeenCalledTimes(3);
      expect(handler).toHaveBeenNthCalledWith(1, "event1", "data1");
      expect(handler).toHaveBeenNthCalledWith(2, "event2", 123);
      expect(handler).toHaveBeenNthCalledWith(3, "event3", true);
    });

    it("should catch all incoming events with array arguments", () => {
      const handler = vi.fn();
      catchAllManager.onAnyIncoming(handler);

      // Dispatch events with array arguments
      clientEventTarget.dispatchEvent(
        new CustomEvent("event1", { detail: ["arg1", "arg2"] }),
      );
      clientEventTarget.dispatchEvent(
        new CustomEvent("event2", { detail: [1, 2, 3] }),
      );

      expect(handler).toHaveBeenCalledTimes(2);
      expect(handler).toHaveBeenNthCalledWith(1, "event1", "arg1", "arg2");
      expect(handler).toHaveBeenNthCalledWith(2, "event2", 1, 2, 3);
    });

    it("should catch events with undefined/null detail", () => {
      const handler = vi.fn();
      catchAllManager.onAnyIncoming(handler);

      // Dispatch events with undefined/null detail
      clientEventTarget.dispatchEvent(
        new CustomEvent("event1", { detail: undefined }),
      );
      clientEventTarget.dispatchEvent(
        new CustomEvent("event2", { detail: null }),
      );

      expect(handler).toHaveBeenCalledTimes(2);
      // Browser converts undefined to null for CustomEvent detail
      expect(handler).toHaveBeenNthCalledWith(1, "event1", null);
      expect(handler).toHaveBeenNthCalledWith(2, "event2", null);
    });

    it("should handle non-CustomEvent events", () => {
      const handler = vi.fn();
      catchAllManager.onAnyIncoming(handler);

      // Dispatch a regular Event
      clientEventTarget.dispatchEvent(new Event("regular-event"));

      expect(handler).toHaveBeenCalledTimes(1);
      expect(handler).toHaveBeenCalledWith("regular-event");
    });
  });

  describe("onAnyOutgoing", () => {
    it("should catch all outgoing events with single arguments", () => {
      const handler = vi.fn();
      catchAllManager.onAnyOutgoing(handler);

      // Dispatch various events on the server target
      serverEventTarget.dispatchEvent(
        new CustomEvent("event1", { detail: "data1" }),
      );
      serverEventTarget.dispatchEvent(
        new CustomEvent("event2", { detail: 123 }),
      );

      expect(handler).toHaveBeenCalledTimes(2);
      expect(handler).toHaveBeenNthCalledWith(1, "event1", "data1");
      expect(handler).toHaveBeenNthCalledWith(2, "event2", 123);
    });

    it("should catch all outgoing events with array arguments", () => {
      const handler = vi.fn();
      catchAllManager.onAnyOutgoing(handler);

      // Dispatch events with array arguments
      serverEventTarget.dispatchEvent(
        new CustomEvent("event1", { detail: ["arg1", "arg2"] }),
      );

      expect(handler).toHaveBeenCalledTimes(1);
      expect(handler).toHaveBeenCalledWith("event1", "arg1", "arg2");
    });

    it("should handle acknowledgment event structure", () => {
      const handler = vi.fn();
      catchAllManager.onAnyOutgoing(handler);

      // Dispatch event with acknowledgment structure
      serverEventTarget.dispatchEvent(
        new CustomEvent("ack-event", {
          detail: {
            ackId: "1234",
            args: ["ack-data1", "ack-data2"],
          },
        }),
      );

      expect(handler).toHaveBeenCalledTimes(1);
      expect(handler).toHaveBeenCalledWith(
        "ack-event",
        "ack-data1",
        "ack-data2",
      );
    });
  });

  describe("offAnyIncoming", () => {
    it("should remove specific incoming handler", () => {
      const handler1 = vi.fn();
      const handler2 = vi.fn();

      catchAllManager.onAnyIncoming(handler1);
      catchAllManager.onAnyIncoming(handler2);

      // Remove only the first handler
      catchAllManager.offAnyIncoming(handler1);

      // Dispatch an event
      clientEventTarget.dispatchEvent(
        new CustomEvent("event", { detail: "data" }),
      );

      expect(handler1).not.toHaveBeenCalled();
      expect(handler2).toHaveBeenCalledTimes(1);
    });

    it("should remove all incoming handlers when no handler is specified", () => {
      const handler1 = vi.fn();
      const handler2 = vi.fn();

      catchAllManager.onAnyIncoming(handler1);
      catchAllManager.onAnyIncoming(handler2);

      // Remove all handlers
      catchAllManager.offAnyIncoming();

      // Dispatch an event
      clientEventTarget.dispatchEvent(
        new CustomEvent("event", { detail: "data" }),
      );

      expect(handler1).not.toHaveBeenCalled();
      expect(handler2).not.toHaveBeenCalled();
    });
  });

  describe("offAnyOutgoing", () => {
    it("should remove specific outgoing handler", () => {
      const handler1 = vi.fn();
      const handler2 = vi.fn();

      catchAllManager.onAnyOutgoing(handler1);
      catchAllManager.onAnyOutgoing(handler2);

      // Remove only the first handler
      catchAllManager.offAnyOutgoing(handler1);

      // Dispatch an event
      serverEventTarget.dispatchEvent(
        new CustomEvent("event", { detail: "data" }),
      );

      expect(handler1).not.toHaveBeenCalled();
      expect(handler2).toHaveBeenCalledTimes(1);
    });

    it("should remove all outgoing handlers when no handler is specified", () => {
      const handler1 = vi.fn();
      const handler2 = vi.fn();

      catchAllManager.onAnyOutgoing(handler1);
      catchAllManager.onAnyOutgoing(handler2);

      // Remove all handlers
      catchAllManager.offAnyOutgoing();

      // Dispatch an event
      serverEventTarget.dispatchEvent(
        new CustomEvent("event", { detail: "data" }),
      );

      expect(handler1).not.toHaveBeenCalled();
      expect(handler2).not.toHaveBeenCalled();
    });
  });

  describe("prependAnyIncoming", () => {
    it("should prepend handler to the event listeners queue", () => {
      const executionOrder: string[] = [];

      // Add regular handler
      catchAllManager.onAnyIncoming(() => {
        executionOrder.push("regular");
      });

      // Prepend handler should execute first
      catchAllManager.prependAnyIncoming(() => {
        executionOrder.push("prepended");
      });

      // Dispatch an event
      clientEventTarget.dispatchEvent(
        new CustomEvent("event", { detail: "data" }),
      );

      // Prepended handler should be called first
      expect(executionOrder).toEqual(["prepended", "regular"]);
    });

    it("should handle array arguments", () => {
      const handler = vi.fn();
      catchAllManager.prependAnyIncoming(handler);

      clientEventTarget.dispatchEvent(
        new CustomEvent("event", { detail: ["arg1", "arg2"] }),
      );

      expect(handler).toHaveBeenCalledWith("event", "arg1", "arg2");
    });
  });

  describe("prependAnyOutgoing", () => {
    it("should prepend handler to the event listeners queue", () => {
      const executionOrder: string[] = [];

      // Add regular handler
      catchAllManager.onAnyOutgoing(() => {
        executionOrder.push("regular");
      });

      // Prepend handler should execute first
      catchAllManager.prependAnyOutgoing(() => {
        executionOrder.push("prepended");
      });

      // Dispatch an event
      serverEventTarget.dispatchEvent(
        new CustomEvent("event", { detail: "data" }),
      );

      // Prepended handler should be called first
      expect(executionOrder).toEqual(["prepended", "regular"]);
    });

    it("should handle acknowledgment event structure", () => {
      const handler = vi.fn();
      catchAllManager.prependAnyOutgoing(handler);

      serverEventTarget.dispatchEvent(
        new CustomEvent("ack-event", {
          detail: {
            ackId: "1234",
            args: ["ack-data1", "ack-data2"],
          },
        }),
      );

      expect(handler).toHaveBeenCalledWith(
        "ack-event",
        "ack-data1",
        "ack-data2",
      );
    });
  });

  describe("listenersAnyIncoming", () => {
    it("should return all registered incoming handlers", () => {
      const handler1 = () => {};
      const handler2 = () => {};

      catchAllManager.onAnyIncoming(handler1);
      catchAllManager.onAnyIncoming(handler2);

      const listeners = catchAllManager.listenersAnyIncoming();

      expect(listeners).toHaveLength(2);
      expect(listeners).toContain(handler1);
      expect(listeners).toContain(handler2);
    });

    it("should return an empty array when no handlers are registered", () => {
      const listeners = catchAllManager.listenersAnyIncoming();
      expect(listeners).toHaveLength(0);
    });
  });

  describe("listenersAnyOutgoing", () => {
    it("should return all registered outgoing handlers", () => {
      const handler1 = () => {};
      const handler2 = () => {};

      catchAllManager.onAnyOutgoing(handler1);
      catchAllManager.onAnyOutgoing(handler2);

      const listeners = catchAllManager.listenersAnyOutgoing();

      expect(listeners).toHaveLength(2);
      expect(listeners).toContain(handler1);
      expect(listeners).toContain(handler2);
    });

    it("should return an empty array when no handlers are registered", () => {
      const listeners = catchAllManager.listenersAnyOutgoing();
      expect(listeners).toHaveLength(0);
    });
  });

  describe("Complex edge cases", () => {
    it("should handle complex object event data for incoming events", () => {
      const handler = vi.fn();
      catchAllManager.onAnyIncoming(handler);

      const complexObj = {
        name: "test",
        nested: { a: 1, b: 2 },
        array: [1, 2, 3],
      };

      clientEventTarget.dispatchEvent(
        new CustomEvent("complex-event", { detail: complexObj }),
      );

      expect(handler).toHaveBeenCalledWith("complex-event", complexObj);
    });

    it("should handle mixed registration and removal operations", () => {
      const handler1 = vi.fn();
      const handler2 = vi.fn();
      const handler3 = vi.fn();

      catchAllManager.onAnyIncoming(handler1);
      catchAllManager.prependAnyIncoming(handler2);
      catchAllManager.onAnyIncoming(handler3);

      // Remove the middle handler
      catchAllManager.offAnyIncoming(handler2);

      clientEventTarget.dispatchEvent(
        new CustomEvent("event", { detail: "data" }),
      );

      expect(handler1).toHaveBeenCalledTimes(1);
      expect(handler2).not.toHaveBeenCalled();
      expect(handler3).toHaveBeenCalledTimes(1);
    });
  });
});
