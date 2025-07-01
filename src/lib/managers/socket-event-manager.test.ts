import { describe, it, expect, beforeEach, vi, afterEach } from "vitest";
import { SocketEventManager } from "./socket-event-manager";
import { SocketEventTarget } from "../target/socket-event-target";

describe("SocketEventManager", () => {
  let socketEventManager: SocketEventManager;
  let clientEventTarget: SocketEventTarget;

  beforeEach(() => {
    clientEventTarget = new SocketEventTarget();
    socketEventManager = new SocketEventManager(clientEventTarget);
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe("clientOn - Event Handler Registration", () => {
    it("should register a handler for an event", () => {
      const handler = vi.fn();
      const result = socketEventManager.clientOn("test-event", handler);

      expect(result).toBe(clientEventTarget);
      expect(socketEventManager.listeners("test-event")).toContain(handler);
    });

    it("should register multiple handlers for the same event", () => {
      const handler1 = vi.fn();
      const handler2 = vi.fn();

      socketEventManager.clientOn("test-event", handler1);
      socketEventManager.clientOn("test-event", handler2);

      const listeners = socketEventManager.listeners("test-event");
      expect(listeners).toContain(handler1);
      expect(listeners).toContain(handler2);
      expect(listeners).toHaveLength(2);
    });

    it("should not duplicate handlers for the same event", () => {
      const handler = vi.fn();

      socketEventManager.clientOn("test-event", handler);
      socketEventManager.clientOn("test-event", handler);

      expect(socketEventManager.listeners("test-event")).toHaveLength(1);
    });

    it("should handle event handlers for different events", () => {
      const handler1 = vi.fn();
      const handler2 = vi.fn();

      socketEventManager.clientOn("event1", handler1);
      socketEventManager.clientOn("event2", handler2);

      expect(socketEventManager.listeners("event1")).toContain(handler1);
      expect(socketEventManager.listeners("event2")).toContain(handler2);
      expect(socketEventManager.listeners("event1")).not.toContain(handler2);
      expect(socketEventManager.listeners("event2")).not.toContain(handler1);
    });
  });

  describe("clientOn - Argument Handling Edge Cases", () => {
    it("should handle undefined event detail", () => {
      const handler = vi.fn();
      socketEventManager.clientOn("undefined-event", handler);

      clientEventTarget.dispatchEvent(
        new CustomEvent("undefined-event", { detail: undefined }),
      );
      expect(handler).toHaveBeenCalledWith(null);
    });

    it("should handle null event detail", () => {
      const handler = vi.fn();
      socketEventManager.clientOn("null-event", handler);

      clientEventTarget.dispatchEvent(
        new CustomEvent("null-event", { detail: null }),
      );
      expect(handler).toHaveBeenCalledWith(null);
    });

    it("should handle falsy values (0, false, empty string)", () => {
      const handler = vi.fn();
      socketEventManager.clientOn("falsy-event", handler);

      clientEventTarget.dispatchEvent(
        new CustomEvent("falsy-event", { detail: 0 }),
      );
      clientEventTarget.dispatchEvent(
        new CustomEvent("falsy-event", { detail: false }),
      );
      clientEventTarget.dispatchEvent(
        new CustomEvent("falsy-event", { detail: "" }),
      );

      expect(handler).toHaveBeenNthCalledWith(1, 0);
      expect(handler).toHaveBeenNthCalledWith(2, false);
      expect(handler).toHaveBeenNthCalledWith(3, "");
    });

    it("should handle single string argument", () => {
      const handler = vi.fn();
      socketEventManager.clientOn("string-event", handler);

      clientEventTarget.dispatchEvent(
        new CustomEvent("string-event", { detail: "test-string" }),
      );
      expect(handler).toHaveBeenCalledWith("test-string");
    });

    it("should handle single number argument", () => {
      const handler = vi.fn();
      socketEventManager.clientOn("number-event", handler);

      clientEventTarget.dispatchEvent(
        new CustomEvent("number-event", { detail: 42 }),
      );
      expect(handler).toHaveBeenCalledWith(42);
    });

    it("should handle single boolean argument", () => {
      const handler = vi.fn();
      socketEventManager.clientOn("boolean-event", handler);

      clientEventTarget.dispatchEvent(
        new CustomEvent("boolean-event", { detail: true }),
      );
      expect(handler).toHaveBeenCalledWith(true);
    });

    it("should handle single array argument (should NOT spread)", () => {
      const handler = vi.fn();
      socketEventManager.clientOn("array-event", handler);

      const testArray = ["item1", "item2", "item3"];
      clientEventTarget.dispatchEvent(
        new CustomEvent("array-event", { detail: testArray }),
      );

      // Should receive the array as a single argument, not spread
      expect(handler).toHaveBeenCalledWith(testArray);
      expect(handler).toHaveBeenCalledTimes(1);
    });

    it("should handle single object argument", () => {
      const handler = vi.fn();
      socketEventManager.clientOn("object-event", handler);

      const testObject = { name: "test", value: 123 };
      clientEventTarget.dispatchEvent(
        new CustomEvent("object-event", { detail: testObject }),
      );

      expect(handler).toHaveBeenCalledWith(testObject);
    });

    it("should handle multiple arguments with _spreadArgs flag", () => {
      const handler = vi.fn();
      socketEventManager.clientOn("spread-event", handler);

      const spreadData = {
        _spreadArgs: true,
        args: ["arg1", "arg2", "arg3"],
      };

      clientEventTarget.dispatchEvent(
        new CustomEvent("spread-event", { detail: spreadData }),
      );

      // Should spread the arguments
      expect(handler).toHaveBeenCalledWith("arg1", "arg2", "arg3");
      expect(handler).toHaveBeenCalledTimes(1);
    });

    it("should handle mixed argument types with _spreadArgs", () => {
      const handler = vi.fn();
      socketEventManager.clientOn("mixed-spread-event", handler);

      const mixedData = {
        _spreadArgs: true,
        args: ["string", 42, true, { key: "value" }, [1, 2, 3]],
      };

      clientEventTarget.dispatchEvent(
        new CustomEvent("mixed-spread-event", { detail: mixedData }),
      );

      expect(handler).toHaveBeenCalledWith(
        "string",
        42,
        true,
        { key: "value" },
        [1, 2, 3],
      );
    });

    it("should handle empty args array with _spreadArgs", () => {
      const handler = vi.fn();
      socketEventManager.clientOn("empty-spread-event", handler);

      const emptySpreadData = {
        _spreadArgs: true,
        args: [],
      };

      clientEventTarget.dispatchEvent(
        new CustomEvent("empty-spread-event", { detail: emptySpreadData }),
      );

      expect(handler).toHaveBeenCalledWith();
      expect(handler).toHaveBeenCalledTimes(1);
    });

    it("should handle objects that contain _spreadArgs but aren't meant for spreading", () => {
      const handler = vi.fn();
      socketEventManager.clientOn("fake-spread-event", handler);

      // This object has _spreadArgs property but it's false
      const fakeSpreadData = {
        _spreadArgs: false,
        data: "test",
        args: ["should", "not", "spread"],
      };

      clientEventTarget.dispatchEvent(
        new CustomEvent("fake-spread-event", { detail: fakeSpreadData }),
      );

      // Should treat as single object, not spread
      expect(handler).toHaveBeenCalledWith(fakeSpreadData);
    });

    it("should handle deeply nested objects", () => {
      const handler = vi.fn();
      socketEventManager.clientOn("nested-event", handler);

      const nestedObject = {
        level1: {
          level2: {
            level3: {
              value: "deep",
              array: [1, 2, { nested: true }],
            },
          },
        },
      };

      clientEventTarget.dispatchEvent(
        new CustomEvent("nested-event", { detail: nestedObject }),
      );

      expect(handler).toHaveBeenCalledWith(nestedObject);
    });

    it("should handle arrays containing objects with _spreadArgs", () => {
      const handler = vi.fn();
      socketEventManager.clientOn("array-with-special", handler);

      const arrayWithSpecial = [{ _spreadArgs: true }, "normal", 123];
      clientEventTarget.dispatchEvent(
        new CustomEvent("array-with-special", { detail: arrayWithSpecial }),
      );

      // Array should be treated as single argument, not spread
      expect(handler).toHaveBeenCalledWith(arrayWithSpecial);
    });

    it("should handle non-CustomEvent events", () => {
      const handler = vi.fn();
      socketEventManager.clientOn("regular-event", handler);

      // Dispatch a regular Event (not CustomEvent)
      clientEventTarget.dispatchEvent(new Event("regular-event"));

      // Handler should not be called for non-CustomEvent
      expect(handler).not.toHaveBeenCalled();
    });
  });

  describe("once - Single Execution Handler", () => {
    it("should execute handler only once", () => {
      const handler = vi.fn();
      socketEventManager.once("once-event", handler);

      clientEventTarget.dispatchEvent(
        new CustomEvent("once-event", { detail: "first" }),
      );
      clientEventTarget.dispatchEvent(
        new CustomEvent("once-event", { detail: "second" }),
      );

      expect(handler).toHaveBeenCalledTimes(1);
      expect(handler).toHaveBeenCalledWith("first");
    });

    it("should handle single array argument in once handler", () => {
      const handler = vi.fn();
      socketEventManager.once("once-array-event", handler);

      const testArray = ["once", "array"];
      clientEventTarget.dispatchEvent(
        new CustomEvent("once-array-event", { detail: testArray }),
      );

      expect(handler).toHaveBeenCalledWith(testArray);
      expect(handler).toHaveBeenCalledTimes(1);
    });

    it("should handle spread arguments in once handler", () => {
      const handler = vi.fn();
      socketEventManager.once("once-spread-event", handler);

      const spreadData = {
        _spreadArgs: true,
        args: ["once", "spread", "args"],
      };

      clientEventTarget.dispatchEvent(
        new CustomEvent("once-spread-event", { detail: spreadData }),
      );

      expect(handler).toHaveBeenCalledWith("once", "spread", "args");
      expect(handler).toHaveBeenCalledTimes(1);
    });

    it("should remove handler from listeners after execution", () => {
      const handler = vi.fn();
      socketEventManager.once("remove-event", handler);

      expect(socketEventManager.listeners("remove-event")).toContain(handler);

      clientEventTarget.dispatchEvent(
        new CustomEvent("remove-event", { detail: "test" }),
      );

      expect(socketEventManager.listeners("remove-event")).not.toContain(
        handler,
      );
      expect(socketEventManager.listeners("remove-event")).toHaveLength(0);
    });

    it("should handle multiple once handlers for the same event", () => {
      const handler1 = vi.fn();
      const handler2 = vi.fn();

      socketEventManager.once("multi-once-event", handler1);
      socketEventManager.once("multi-once-event", handler2);

      expect(socketEventManager.listeners("multi-once-event")).toHaveLength(2);

      clientEventTarget.dispatchEvent(
        new CustomEvent("multi-once-event", { detail: "test" }),
      );

      expect(handler1).toHaveBeenCalledTimes(1);
      expect(handler2).toHaveBeenCalledTimes(1);
      expect(socketEventManager.listeners("multi-once-event")).toHaveLength(0);
    });

    it("should handle once handler with undefined/null detail", () => {
      const handler = vi.fn();
      socketEventManager.once("once-null-event", handler);

      clientEventTarget.dispatchEvent(
        new CustomEvent("once-null-event", { detail: null }),
      );

      expect(handler).toHaveBeenCalledWith(null);
      expect(handler).toHaveBeenCalledTimes(1);
      expect(socketEventManager.listeners("once-null-event")).toHaveLength(0);
    });

    it("should handle once handler with empty _spreadArgs", () => {
      const handler = vi.fn();
      socketEventManager.once("once-empty-spread", handler);

      const emptySpread = {
        _spreadArgs: true,
        args: [],
      };

      clientEventTarget.dispatchEvent(
        new CustomEvent("once-empty-spread", { detail: emptySpread }),
      );

      expect(handler).toHaveBeenCalledWith();
      expect(handler).toHaveBeenCalledTimes(1);
      expect(socketEventManager.listeners("once-empty-spread")).toHaveLength(0);
    });
  });

  describe("off - Handler Removal", () => {
    it("should remove a specific handler", () => {
      const handler1 = vi.fn();
      const handler2 = vi.fn();

      socketEventManager.clientOn("remove-test", handler1);
      socketEventManager.clientOn("remove-test", handler2);

      expect(socketEventManager.listeners("remove-test")).toHaveLength(2);

      const result = socketEventManager.off("remove-test", handler1);

      expect(result).toBe(clientEventTarget);
      const remainingListeners = socketEventManager.listeners("remove-test");
      expect(remainingListeners).toHaveLength(1);
      expect(remainingListeners).toContain(handler2);
      expect(remainingListeners).not.toContain(handler1);
    });

    it("should remove event registry when last handler is removed", () => {
      const handler = vi.fn();
      socketEventManager.clientOn("last-handler", handler);

      expect(socketEventManager.listeners("last-handler")).toHaveLength(1);

      socketEventManager.off("last-handler", handler);

      expect(socketEventManager.listeners("last-handler")).toHaveLength(0);
    });

    it("should handle removing non-existent handler", () => {
      const handler1 = vi.fn();
      const handler2 = vi.fn();

      socketEventManager.clientOn("non-existent-test", handler1);

      // Try to remove a handler that was never added
      const result = socketEventManager.off("non-existent-test", handler2);

      expect(result).toBe(clientEventTarget);
      expect(socketEventManager.listeners("non-existent-test")).toContain(
        handler1,
      );
      expect(socketEventManager.listeners("non-existent-test")).toHaveLength(1);
    });

    it("should handle removing handler from non-existent event", () => {
      const handler = vi.fn();

      const result = socketEventManager.off("non-existent-event", handler);

      expect(result).toBe(clientEventTarget);
    });

    it("should prevent removed handler from being called", () => {
      const handler = vi.fn();
      socketEventManager.clientOn("prevent-call", handler);

      socketEventManager.off("prevent-call", handler);

      clientEventTarget.dispatchEvent(
        new CustomEvent("prevent-call", { detail: "test" }),
      );

      expect(handler).not.toHaveBeenCalled();
    });

    it("should handle removing once handler before it's triggered", () => {
      const handler = vi.fn();
      socketEventManager.once("remove-once", handler);

      expect(socketEventManager.listeners("remove-once")).toContain(handler);

      socketEventManager.off("remove-once", handler);

      expect(socketEventManager.listeners("remove-once")).toHaveLength(0);

      clientEventTarget.dispatchEvent(
        new CustomEvent("remove-once", { detail: "test" }),
      );

      expect(handler).not.toHaveBeenCalled();
    });
  });

  describe("listeners - Handler Listing", () => {
    it("should return all handlers for a specific event", () => {
      const handler1 = vi.fn();
      const handler2 = vi.fn();
      const handler3 = vi.fn();

      socketEventManager.clientOn("list-test", handler1);
      socketEventManager.clientOn("list-test", handler2);
      socketEventManager.clientOn("other-event", handler3);

      const listeners = socketEventManager.listeners("list-test");

      expect(listeners).toHaveLength(2);
      expect(listeners).toContain(handler1);
      expect(listeners).toContain(handler2);
      expect(listeners).not.toContain(handler3);
    });

    it("should return empty array for event with no handlers", () => {
      const listeners = socketEventManager.listeners("no-handlers");
      expect(listeners).toEqual([]);
    });

    it("should return all handlers for all events when no event specified", () => {
      const handler1 = vi.fn();
      const handler2 = vi.fn();
      const handler3 = vi.fn();

      socketEventManager.clientOn("event1", handler1);
      socketEventManager.clientOn("event2", handler2);
      socketEventManager.clientOn("event2", handler3);

      const allListeners = socketEventManager.listeners();

      expect(allListeners).toHaveLength(3);
      expect(allListeners).toContain(handler1);
      expect(allListeners).toContain(handler2);
      expect(allListeners).toContain(handler3);
    });

    it("should return empty array when no handlers registered", () => {
      const allListeners = socketEventManager.listeners();
      expect(allListeners).toEqual([]);
    });

    it("should update listeners list after handler removal", () => {
      const handler1 = vi.fn();
      const handler2 = vi.fn();

      socketEventManager.clientOn("update-test", handler1);
      socketEventManager.clientOn("update-test", handler2);

      expect(socketEventManager.listeners("update-test")).toHaveLength(2);

      socketEventManager.off("update-test", handler1);

      expect(socketEventManager.listeners("update-test")).toHaveLength(1);
      expect(socketEventManager.listeners("update-test")).toContain(handler2);
    });

    it("should handle listeners for once handlers", () => {
      const onceHandler = vi.fn();
      const regularHandler = vi.fn();

      socketEventManager.once("mixed-handlers", onceHandler);
      socketEventManager.clientOn("mixed-handlers", regularHandler);

      const listeners = socketEventManager.listeners("mixed-handlers");

      expect(listeners).toHaveLength(2);
      expect(listeners).toContain(onceHandler);
      expect(listeners).toContain(regularHandler);
    });
  });

  describe("Mixed Scenarios", () => {
    it("should handle mix of clientOn and once handlers", () => {
      const onHandler = vi.fn();
      const onceHandler = vi.fn();

      socketEventManager.clientOn("mixed-event", onHandler);
      socketEventManager.once("mixed-event", onceHandler);

      expect(socketEventManager.listeners("mixed-event")).toHaveLength(2);

      // First event
      clientEventTarget.dispatchEvent(
        new CustomEvent("mixed-event", { detail: "first" }),
      );

      expect(onHandler).toHaveBeenCalledWith("first");
      expect(onceHandler).toHaveBeenCalledWith("first");
      expect(socketEventManager.listeners("mixed-event")).toHaveLength(1);

      // Second event
      clientEventTarget.dispatchEvent(
        new CustomEvent("mixed-event", { detail: "second" }),
      );

      expect(onHandler).toHaveBeenCalledWith("second");
      expect(onceHandler).toHaveBeenCalledTimes(1); // Still only called once
    });

    it("should handle complex event sequences with different argument types", () => {
      const handler = vi.fn();
      socketEventManager.clientOn("sequence-event", handler);

      // Single string
      clientEventTarget.dispatchEvent(
        new CustomEvent("sequence-event", { detail: "string" }),
      );

      // Single array
      clientEventTarget.dispatchEvent(
        new CustomEvent("sequence-event", { detail: [1, 2, 3] }),
      );

      // Spread arguments
      clientEventTarget.dispatchEvent(
        new CustomEvent("sequence-event", {
          detail: { _spreadArgs: true, args: ["a", "b", "c"] },
        }),
      );

      // Undefined
      clientEventTarget.dispatchEvent(
        new CustomEvent("sequence-event", { detail: undefined }),
      );

      // Null
      clientEventTarget.dispatchEvent(
        new CustomEvent("sequence-event", { detail: null }),
      );

      expect(handler).toHaveBeenNthCalledWith(1, "string");
      expect(handler).toHaveBeenNthCalledWith(2, [1, 2, 3]);
      expect(handler).toHaveBeenNthCalledWith(3, "a", "b", "c");
      expect(handler).toHaveBeenNthCalledWith(4, null);
      expect(handler).toHaveBeenNthCalledWith(5, null);
      expect(handler).toHaveBeenCalledTimes(5);
    });

    it("should handle rapid event dispatching", () => {
      const handler = vi.fn();
      socketEventManager.clientOn("rapid-event", handler);

      // Dispatch multiple events rapidly
      for (let i = 0; i < 100; i++) {
        clientEventTarget.dispatchEvent(
          new CustomEvent("rapid-event", { detail: i }),
        );
      }

      expect(handler).toHaveBeenCalledTimes(100);
      for (let i = 0; i < 100; i++) {
        expect(handler).toHaveBeenNthCalledWith(i + 1, i);
      }
    });

    it("should handle concurrent once handlers removal", () => {
      const handler1 = vi.fn();
      const handler2 = vi.fn();
      const handler3 = vi.fn();

      socketEventManager.once("concurrent-once", handler1);
      socketEventManager.once("concurrent-once", handler2);
      socketEventManager.once("concurrent-once", handler3);

      expect(socketEventManager.listeners("concurrent-once")).toHaveLength(3);

      // All should be called and removed
      clientEventTarget.dispatchEvent(
        new CustomEvent("concurrent-once", { detail: "test" }),
      );

      expect(handler1).toHaveBeenCalledTimes(1);
      expect(handler2).toHaveBeenCalledTimes(1);
      expect(handler3).toHaveBeenCalledTimes(1);
      expect(socketEventManager.listeners("concurrent-once")).toHaveLength(0);
    });
  });

  describe("Edge Cases with Special Values", () => {
    it("should handle BigInt values", () => {
      const handler = vi.fn();
      socketEventManager.clientOn("bigint-event", handler);

      const bigIntValue = BigInt(123456789);
      clientEventTarget.dispatchEvent(
        new CustomEvent("bigint-event", { detail: bigIntValue }),
      );

      expect(handler).toHaveBeenCalledWith(bigIntValue);
    });

    it("should handle Symbol values", () => {
      const handler = vi.fn();
      socketEventManager.clientOn("symbol-event", handler);

      const symbolValue = Symbol("test");
      clientEventTarget.dispatchEvent(
        new CustomEvent("symbol-event", { detail: symbolValue }),
      );

      expect(handler).toHaveBeenCalledWith(symbolValue);
    });

    it("should handle Date objects", () => {
      const handler = vi.fn();
      socketEventManager.clientOn("date-event", handler);

      const dateValue = new Date();
      clientEventTarget.dispatchEvent(
        new CustomEvent("date-event", { detail: dateValue }),
      );

      expect(handler).toHaveBeenCalledWith(dateValue);
    });

    it("should handle RegExp objects", () => {
      const handler = vi.fn();
      socketEventManager.clientOn("regex-event", handler);

      const regexValue = /test/gi;
      clientEventTarget.dispatchEvent(
        new CustomEvent("regex-event", { detail: regexValue }),
      );

      expect(handler).toHaveBeenCalledWith(regexValue);
    });

    it("should handle Set and Map objects", () => {
      const handler = vi.fn();
      socketEventManager.clientOn("collection-event", handler);

      const setValue = new Set([1, 2, 3]);
      const mapValue = new Map([["key", "value"]]);

      clientEventTarget.dispatchEvent(
        new CustomEvent("collection-event", { detail: setValue }),
      );
      clientEventTarget.dispatchEvent(
        new CustomEvent("collection-event", { detail: mapValue }),
      );

      expect(handler).toHaveBeenNthCalledWith(1, setValue);
      expect(handler).toHaveBeenNthCalledWith(2, mapValue);
    });

    it("should handle functions as detail (though not common in real usage)", () => {
      const handler = vi.fn();
      socketEventManager.clientOn("function-event", handler);

      const functionValue = () => "test";
      clientEventTarget.dispatchEvent(
        new CustomEvent("function-event", { detail: functionValue }),
      );

      expect(handler).toHaveBeenCalledWith(functionValue);
    });

    it("should handle circular references in objects", () => {
      const handler = vi.fn();
      socketEventManager.clientOn("circular-event", handler);

      const circularObj: any = { name: "test" };
      circularObj.self = circularObj;

      clientEventTarget.dispatchEvent(
        new CustomEvent("circular-event", { detail: circularObj }),
      );

      expect(handler).toHaveBeenCalledWith(circularObj);
    });
  });
});
