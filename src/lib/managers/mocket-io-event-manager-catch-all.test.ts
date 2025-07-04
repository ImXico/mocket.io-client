import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { MocketioEventManagerCatchAll } from "./mocket-io-event-manager-catch-all";
import { MocketioEventTarget } from "../target/socket-event-target";
import { CATCH_ALL_EVENT_TYPE } from "../constants";

describe("MocketioEventManagerCatchAll", () => {
  let clientEventTarget: MocketioEventTarget;
  let serverEventTarget: MocketioEventTarget;
  let catchAllManager: MocketioEventManagerCatchAll;

  beforeEach(() => {
    clientEventTarget = new MocketioEventTarget();
    serverEventTarget = new MocketioEventTarget();
    catchAllManager = new MocketioEventManagerCatchAll(
      clientEventTarget,
      serverEventTarget,
    );
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe("onAnyIncoming", () => {
    it("should register handler for incoming events on client target", () => {
      const handler = vi.fn();
      const addEventListenerSpy = vi.spyOn(
        clientEventTarget,
        "addEventListener",
      );

      const result = catchAllManager.onAnyIncoming(handler);

      expect(addEventListenerSpy).toHaveBeenCalledWith(
        CATCH_ALL_EVENT_TYPE,
        expect.any(Function),
      );
      expect(result).toBe(clientEventTarget);
    });

    it("should handle custom events with single argument", () => {
      const handler = vi.fn();
      catchAllManager.onAnyIncoming(handler);

      clientEventTarget.dispatchEvent(
        new CustomEvent("test-event", {
          detail: "test-data",
        }),
      );

      expect(handler).toHaveBeenCalledWith("test-event", "test-data");
    });

    it("should handle custom events with array detail (spread arguments)", () => {
      const handler = vi.fn();
      catchAllManager.onAnyIncoming(handler);

      clientEventTarget.dispatchEvent(
        new CustomEvent("test-event", {
          detail: ["arg1", "arg2", "arg3"],
        }),
      );

      expect(handler).toHaveBeenCalledWith("test-event", [
        "arg1",
        "arg2",
        "arg3",
      ]);
    });

    it("should handle custom events with no detail", () => {
      const handler = vi.fn();
      catchAllManager.onAnyIncoming(handler);

      clientEventTarget.dispatchEvent(new CustomEvent("test-event"));

      expect(handler).toHaveBeenCalledWith("test-event");
    });

    it("should handle custom events with complex object detail", () => {
      const handler = vi.fn();
      catchAllManager.onAnyIncoming(handler);

      const complexData = { foo: "bar", nested: { value: 42 } };
      clientEventTarget.dispatchEvent(
        new CustomEvent("test-event", {
          detail: complexData,
        }),
      );

      expect(handler).toHaveBeenCalledWith("test-event", complexData);
    });

    it("should ignore non-custom events", () => {
      const handler = vi.fn();
      catchAllManager.onAnyIncoming(handler);

      clientEventTarget.dispatchEvent(new Event("regular-event"));

      expect(handler).not.toHaveBeenCalledWith();
    });

    it("should handle events with null detail", () => {
      const handler = vi.fn();
      catchAllManager.onAnyIncoming(handler);

      clientEventTarget.dispatchEvent(
        new CustomEvent("test-event", {
          detail: null,
        }),
      );

      expect(handler).toHaveBeenCalledWith("test-event");
    });

    it("should handle falsy values as valid detail", () => {
      const handler = vi.fn();
      catchAllManager.onAnyIncoming(handler);

      // Test various falsy values
      clientEventTarget.dispatchEvent(new CustomEvent("test1", { detail: 0 }));
      expect(handler).toHaveBeenCalledWith("test1", 0);

      clientEventTarget.dispatchEvent(
        new CustomEvent("test2", { detail: false }),
      );
      expect(handler).toHaveBeenCalledWith("test2", false);

      clientEventTarget.dispatchEvent(new CustomEvent("test3", { detail: "" }));
      expect(handler).toHaveBeenCalledWith("test3", "");
    });

    it("should store handler in registry", () => {
      const handler = vi.fn();
      catchAllManager.onAnyIncoming(handler);

      const listeners = catchAllManager.listenersAnyIncoming();
      expect(listeners).toContain(handler);
      expect(listeners).toHaveLength(1);
    });

    it("should register multiple handlers", () => {
      const handler1 = vi.fn();
      const handler2 = vi.fn();

      catchAllManager.onAnyIncoming(handler1);
      catchAllManager.onAnyIncoming(handler2);

      clientEventTarget.dispatchEvent(
        new CustomEvent("test-event", {
          detail: "test-data",
        }),
      );

      expect(handler1).toHaveBeenCalledWith("test-event", "test-data");
      expect(handler2).toHaveBeenCalledWith("test-event", "test-data");

      const listeners = catchAllManager.listenersAnyIncoming();
      expect(listeners).toHaveLength(2);
      expect(listeners).toContain(handler1);
      expect(listeners).toContain(handler2);
    });
  });

  describe("onAnyOutgoing", () => {
    it("should register handler for outgoing events on server target", () => {
      const handler = vi.fn();
      const addEventListenerSpy = vi.spyOn(
        serverEventTarget,
        "addEventListener",
      );

      const result = catchAllManager.onAnyOutgoing(handler);

      expect(addEventListenerSpy).toHaveBeenCalledWith(
        CATCH_ALL_EVENT_TYPE,
        expect.any(Function),
      );
      expect(result).toBe(clientEventTarget);
    });

    it("should handle outgoing custom events", () => {
      const handler = vi.fn();
      catchAllManager.onAnyOutgoing(handler);

      serverEventTarget.dispatchEvent(
        new CustomEvent("outgoing-event", {
          detail: "outgoing-data",
        }),
      );

      expect(handler).toHaveBeenCalledWith("outgoing-event", "outgoing-data");
    });

    it("should ignore ack events in outgoing handler", () => {
      const handler = vi.fn();
      catchAllManager.onAnyOutgoing(handler);

      serverEventTarget.dispatchEvent(
        new CustomEvent("test-event:ack", {
          detail: "ack-data",
        }),
      );

      expect(handler).not.toHaveBeenCalled();
    });

    it("should handle outgoing events with multiple arguments", () => {
      const handler = vi.fn();
      catchAllManager.onAnyOutgoing(handler);

      serverEventTarget.dispatchEvent(
        new CustomEvent("outgoing-event", {
          detail: { _spreadArgs: true, args: ["arg1", "arg2"] },
        }),
      );

      expect(handler).toHaveBeenCalledWith("outgoing-event", "arg1", "arg2");
    });

    it("should store handler in registry", () => {
      const handler = vi.fn();
      catchAllManager.onAnyOutgoing(handler);

      const listeners = catchAllManager.listenersAnyOutgoing();
      expect(listeners).toContain(handler);
      expect(listeners).toHaveLength(1);
    });
  });

  describe("offAnyIncoming", () => {
    it("should remove specific handler", () => {
      const handler1 = vi.fn();
      const handler2 = vi.fn();
      const removeEventListenerSpy = vi.spyOn(
        clientEventTarget,
        "removeEventListener",
      );

      catchAllManager.onAnyIncoming(handler1);
      catchAllManager.onAnyIncoming(handler2);

      const result = catchAllManager.offAnyIncoming(handler1);

      expect(removeEventListenerSpy).toHaveBeenCalledWith(
        CATCH_ALL_EVENT_TYPE,
        expect.any(Function),
      );
      expect(result).toBe(clientEventTarget);

      const listeners = catchAllManager.listenersAnyIncoming();
      expect(listeners).not.toContain(handler1);
      expect(listeners).toContain(handler2);
      expect(listeners).toHaveLength(1);
    });

    it("should remove all handlers when no specific handler provided", () => {
      const handler1 = vi.fn();
      const handler2 = vi.fn();
      const removeEventListenerSpy = vi.spyOn(
        clientEventTarget,
        "removeEventListener",
      );

      catchAllManager.onAnyIncoming(handler1);
      catchAllManager.onAnyIncoming(handler2);

      const result = catchAllManager.offAnyIncoming();

      expect(removeEventListenerSpy).toHaveBeenCalledTimes(2);
      expect(result).toBe(clientEventTarget);

      const listeners = catchAllManager.listenersAnyIncoming();
      expect(listeners).toHaveLength(0);
    });

    it("should handle removal of non-existent handler gracefully", () => {
      const handler = vi.fn();
      const nonExistentHandler = vi.fn();
      const removeEventListenerSpy = vi.spyOn(
        clientEventTarget,
        "removeEventListener",
      );

      catchAllManager.onAnyIncoming(handler);
      const result = catchAllManager.offAnyIncoming(nonExistentHandler);

      expect(removeEventListenerSpy).not.toHaveBeenCalled();
      expect(result).toBe(clientEventTarget);

      const listeners = catchAllManager.listenersAnyIncoming();
      expect(listeners).toContain(handler);
      expect(listeners).toHaveLength(1);
    });

    it("should verify handler is actually removed from event target", () => {
      const handler = vi.fn();
      catchAllManager.onAnyIncoming(handler);

      // Verify handler works before removal
      clientEventTarget.dispatchEvent(
        new CustomEvent("test-event", {
          detail: "test-data",
        }),
      );
      expect(handler).toHaveBeenCalledOnce();

      // Remove handler
      catchAllManager.offAnyIncoming(handler);

      // Verify handler no longer responds
      handler.mockClear();
      clientEventTarget.dispatchEvent(
        new CustomEvent("test-event", {
          detail: "test-data",
        }),
      );
      expect(handler).not.toHaveBeenCalled();
    });
  });

  describe("offAnyOutgoing", () => {
    it("should remove specific outgoing handler", () => {
      const handler1 = vi.fn();
      const handler2 = vi.fn();
      const removeEventListenerSpy = vi.spyOn(
        serverEventTarget,
        "removeEventListener",
      );

      catchAllManager.onAnyOutgoing(handler1);
      catchAllManager.onAnyOutgoing(handler2);

      const result = catchAllManager.offAnyOutgoing(handler1);

      expect(removeEventListenerSpy).toHaveBeenCalledWith(
        CATCH_ALL_EVENT_TYPE,
        expect.any(Function),
      );
      expect(result).toBe(clientEventTarget);

      const listeners = catchAllManager.listenersAnyOutgoing();
      expect(listeners).not.toContain(handler1);
      expect(listeners).toContain(handler2);
      expect(listeners).toHaveLength(1);
    });

    it("should remove all outgoing handlers when no specific handler provided", () => {
      const handler1 = vi.fn();
      const handler2 = vi.fn();
      const removeEventListenerSpy = vi.spyOn(
        serverEventTarget,
        "removeEventListener",
      );

      catchAllManager.onAnyOutgoing(handler1);
      catchAllManager.onAnyOutgoing(handler2);

      const result = catchAllManager.offAnyOutgoing();

      expect(removeEventListenerSpy).toHaveBeenCalledTimes(2);
      expect(result).toBe(clientEventTarget);

      const listeners = catchAllManager.listenersAnyOutgoing();
      expect(listeners).toHaveLength(0);
    });

    it("should verify outgoing handler is actually removed", () => {
      const handler = vi.fn();
      catchAllManager.onAnyOutgoing(handler);

      // Verify handler works before removal
      serverEventTarget.dispatchEvent(
        new CustomEvent("test-event", {
          detail: "test-data",
        }),
      );
      expect(handler).toHaveBeenCalledOnce();

      // Remove handler
      catchAllManager.offAnyOutgoing(handler);

      // Verify handler no longer responds
      handler.mockClear();
      serverEventTarget.dispatchEvent(
        new CustomEvent("test-event", {
          detail: "test-data",
        }),
      );
      expect(handler).not.toHaveBeenCalled();
    });
  });

  describe("prependAnyIncoming", () => {
    it("should register handler with prepend method", () => {
      const handler = vi.fn();
      const prependEventListenerSpy = vi.spyOn(
        clientEventTarget,
        "prependEventListener",
      );

      const result = catchAllManager.prependAnyIncoming(handler);

      expect(prependEventListenerSpy).toHaveBeenCalledWith(
        CATCH_ALL_EVENT_TYPE,
        expect.any(Function),
      );
      expect(result).toBe(clientEventTarget);
    });

    it("should handle prepended events and ignore ack events", () => {
      const handler = vi.fn();
      catchAllManager.prependAnyIncoming(handler);

      // Should handle regular custom events
      clientEventTarget.dispatchEvent(
        new CustomEvent("test-event", {
          detail: "test-data",
        }),
      );
      expect(handler).toHaveBeenCalledWith("test-event", "test-data");

      // Should ignore ack events
      handler.mockClear();
      clientEventTarget.dispatchEvent(
        new CustomEvent("test-event:ack", {
          detail: "ack-data",
        }),
      );
      expect(handler).not.toHaveBeenCalled();
    });

    it("should store prepended handler in registry", () => {
      const handler = vi.fn();
      catchAllManager.prependAnyIncoming(handler);

      const listeners = catchAllManager.listenersAnyIncoming();
      expect(listeners).toContain(handler);
      expect(listeners).toHaveLength(1);
    });

    it("should handle multiple arguments in prepended handler", () => {
      const handler = vi.fn();
      catchAllManager.prependAnyIncoming(handler);

      clientEventTarget.dispatchEvent(
        new CustomEvent("test-event", {
          detail: { _spreadArgs: true, args: ["arg1", "arg2", "arg3"] },
        }),
      );

      expect(handler).toHaveBeenCalledWith(
        "test-event",
        "arg1",
        "arg2",
        "arg3",
      );
    });
  });

  describe("prependAnyOutgoing", () => {
    it("should register outgoing handler with prepend method", () => {
      const handler = vi.fn();
      const prependEventListenerSpy = vi.spyOn(
        serverEventTarget,
        "prependEventListener",
      );

      const result = catchAllManager.prependAnyOutgoing(handler);

      expect(prependEventListenerSpy).toHaveBeenCalledWith(
        CATCH_ALL_EVENT_TYPE,
        expect.any(Function),
      );
      expect(result).toBe(clientEventTarget);
    });

    it("should handle prepended outgoing events and ignore ack events", () => {
      const handler = vi.fn();
      catchAllManager.prependAnyOutgoing(handler);

      // Should handle regular custom events
      serverEventTarget.dispatchEvent(
        new CustomEvent("test-event", {
          detail: "test-data",
        }),
      );
      expect(handler).toHaveBeenCalledWith("test-event", "test-data");

      handler.mockClear();

      // Should ignore ack events
      serverEventTarget.dispatchEvent(
        new CustomEvent("test-event:ack", {
          detail: "ack-data",
        }),
      );
      expect(handler).not.toHaveBeenCalled();
    });

    it("should ignore non-custom events", () => {
      const handler = vi.fn();
      catchAllManager.prependAnyOutgoing(handler);

      // Regular events should be ignored
      serverEventTarget.dispatchEvent(new Event("regular-event"));

      expect(handler).not.toHaveBeenCalled();
    });

    it("should store prepended outgoing handler in registry", () => {
      const handler = vi.fn();
      catchAllManager.prependAnyOutgoing(handler);

      const listeners = catchAllManager.listenersAnyOutgoing();
      expect(listeners).toContain(handler);
      expect(listeners).toHaveLength(1);
    });
  });

  describe("listenersAnyIncoming", () => {
    it("should return empty array when no handlers registered", () => {
      const listeners = catchAllManager.listenersAnyIncoming();
      expect(listeners).toEqual([]);
    });

    it("should return array of registered handlers", () => {
      const handler1 = vi.fn();
      const handler2 = vi.fn();

      catchAllManager.onAnyIncoming(handler1);
      catchAllManager.prependAnyIncoming(handler2);

      const listeners = catchAllManager.listenersAnyIncoming();
      expect(listeners).toHaveLength(2);
      expect(listeners).toContain(handler1);
      expect(listeners).toContain(handler2);
    });

    it("should not include removed handlers", () => {
      const handler1 = vi.fn();
      const handler2 = vi.fn();

      catchAllManager.onAnyIncoming(handler1);
      catchAllManager.onAnyIncoming(handler2);
      catchAllManager.offAnyIncoming(handler1);

      const listeners = catchAllManager.listenersAnyIncoming();
      expect(listeners).toHaveLength(1);
      expect(listeners).not.toContain(handler1);
      expect(listeners).toContain(handler2);
    });
  });

  describe("listenersAnyOutgoing", () => {
    it("should return empty array when no handlers registered", () => {
      const listeners = catchAllManager.listenersAnyOutgoing();
      expect(listeners).toEqual([]);
    });

    it("should return array of registered outgoing handlers", () => {
      const handler1 = vi.fn();
      const handler2 = vi.fn();

      catchAllManager.onAnyOutgoing(handler1);
      catchAllManager.prependAnyOutgoing(handler2);

      const listeners = catchAllManager.listenersAnyOutgoing();
      expect(listeners).toHaveLength(2);
      expect(listeners).toContain(handler1);
      expect(listeners).toContain(handler2);
    });

    it("should not include removed outgoing handlers", () => {
      const handler1 = vi.fn();
      const handler2 = vi.fn();

      catchAllManager.onAnyOutgoing(handler1);
      catchAllManager.onAnyOutgoing(handler2);
      catchAllManager.offAnyOutgoing(handler1);

      const listeners = catchAllManager.listenersAnyOutgoing();
      expect(listeners).toHaveLength(1);
      expect(listeners).not.toContain(handler1);
      expect(listeners).toContain(handler2);
    });
  });

  describe("integration scenarios", () => {
    it("should handle mixed incoming and outgoing handlers", () => {
      const incomingHandler = vi.fn();
      const outgoingHandler = vi.fn();

      catchAllManager.onAnyIncoming(incomingHandler);
      catchAllManager.onAnyOutgoing(outgoingHandler);

      // Trigger incoming event
      clientEventTarget.dispatchEvent(
        new CustomEvent("incoming-event", {
          detail: "incoming-data",
        }),
      );

      // Trigger outgoing event
      serverEventTarget.dispatchEvent(
        new CustomEvent("outgoing-event", {
          detail: "outgoing-data",
        }),
      );

      expect(incomingHandler).toHaveBeenCalledWith(
        "incoming-event",
        "incoming-data",
      );
      expect(outgoingHandler).toHaveBeenCalledWith(
        "outgoing-event",
        "outgoing-data",
      );

      expect(catchAllManager.listenersAnyIncoming()).toHaveLength(1);
      expect(catchAllManager.listenersAnyOutgoing()).toHaveLength(1);
    });

    it("should maintain separate registries for incoming and outgoing", () => {
      const sharedHandler = vi.fn();

      catchAllManager.onAnyIncoming(sharedHandler);
      catchAllManager.onAnyOutgoing(sharedHandler);

      expect(catchAllManager.listenersAnyIncoming()).toContain(sharedHandler);
      expect(catchAllManager.listenersAnyOutgoing()).toContain(sharedHandler);

      // Remove from incoming should not affect outgoing
      catchAllManager.offAnyIncoming(sharedHandler);

      expect(catchAllManager.listenersAnyIncoming()).not.toContain(
        sharedHandler,
      );
      expect(catchAllManager.listenersAnyOutgoing()).toContain(sharedHandler);
    });

    it("should handle rapid add/remove operations", () => {
      const handler = vi.fn();

      // Add and remove multiple times
      catchAllManager.onAnyIncoming(handler);
      catchAllManager.offAnyIncoming(handler);
      catchAllManager.prependAnyIncoming(handler);
      catchAllManager.offAnyIncoming(handler);
      catchAllManager.onAnyIncoming(handler);

      expect(catchAllManager.listenersAnyIncoming()).toHaveLength(1);
      expect(catchAllManager.listenersAnyIncoming()).toContain(handler);
    });
  });

  describe("edge cases", () => {
    it("should handle events with circular reference objects", () => {
      const handler = vi.fn();
      catchAllManager.onAnyIncoming(handler);

      const circularObj: any = { name: "test" };
      circularObj.self = circularObj;

      clientEventTarget.dispatchEvent(
        new CustomEvent("circular-event", {
          detail: circularObj,
        }),
      );

      expect(handler).toHaveBeenCalledWith("circular-event", circularObj);
    });

    it("should handle very large arrays as detail", () => {
      const handler = vi.fn();
      catchAllManager.onAnyIncoming(handler);

      const largeArray = new Array(10).fill(0).map((_, i) => i);

      clientEventTarget.dispatchEvent(
        new CustomEvent("large-array-event", {
          detail: largeArray,
        }),
      );

      expect(handler).toHaveBeenCalledWith("large-array-event", largeArray);
    });

    it("should handle special event names", () => {
      const handler = vi.fn();
      catchAllManager.onAnyIncoming(handler);

      // Test special characters in event names
      const specialEventNames = [
        "event:with:colons",
        "event-with-dashes",
        "event_with_underscores",
        "123numeric",
      ];

      specialEventNames.forEach((eventName) => {
        handler.mockClear();
        clientEventTarget.dispatchEvent(
          new CustomEvent(eventName, {
            detail: "test-data",
          }),
        );
        expect(handler).toHaveBeenCalledWith(eventName, "test-data");
      });
    });
  });
});
