import { describe, it, expect, vi, beforeEach } from "vitest";
import {
  isCustomEvent,
  handleCustomCatchAllEventWithNoAck,
  handleCustomEventWithNoAck,
  handleCustomEventWithAck,
} from "./util";

describe("util.ts", () => {
  describe("isCustomEvent", () => {
    it("should return true for CustomEvent instances", () => {
      const customEvent = new CustomEvent("test", { detail: "data" });
      expect(isCustomEvent(customEvent)).toBe(true);
    });

    it("should return true for CustomEvent with no detail", () => {
      const customEvent = new CustomEvent("test");
      expect(isCustomEvent(customEvent)).toBe(true);
    });

    it("should return true for CustomEvent with null detail", () => {
      const customEvent = new CustomEvent("test", { detail: null });
      expect(isCustomEvent(customEvent)).toBe(true);
    });

    it("should return false for regular Event instances", () => {
      const regularEvent = new Event("test");
      expect(isCustomEvent(regularEvent)).toBe(false);
    });

    it("should return false for plain objects", () => {
      const plainObject = { type: "test" };
      expect(isCustomEvent(plainObject as any)).toBe(false);
    });

    it("should return false for objects with detail property but not Event instances", () => {
      const fakeEvent = { detail: "data", type: "test" };
      expect(isCustomEvent(fakeEvent as any)).toBe(false);
    });

    it("should handle edge case objects", () => {
      expect(isCustomEvent(null as any)).toBe(false);
      expect(isCustomEvent(undefined as any)).toBe(false);
      expect(isCustomEvent("string" as any)).toBe(false);
      expect(isCustomEvent(123 as any)).toBe(false);
    });
  });

  describe("handleCustomCatchAllEventWithNoAck", () => {
    let handler: ReturnType<typeof vi.fn>;

    beforeEach(() => {
      handler = vi.fn();
    });

    it("should call handler with event type when detail is undefined", () => {
      const event = new CustomEvent("test-event", { detail: undefined });

      handleCustomCatchAllEventWithNoAck(event, handler);

      expect(handler).toHaveBeenCalledWith("test-event");
      expect(handler).toHaveBeenCalledTimes(1);
    });

    it("should call handler with event type when detail is null", () => {
      const event = new CustomEvent("test-event", { detail: null });

      handleCustomCatchAllEventWithNoAck(event, handler);

      expect(handler).toHaveBeenCalledWith("test-event");
      expect(handler).toHaveBeenCalledTimes(1);
    });

    it("should call handler with event type and single argument", () => {
      const event = new CustomEvent("test-event", { detail: "test-data" });

      handleCustomCatchAllEventWithNoAck(event, handler);

      expect(handler).toHaveBeenCalledWith("test-event", "test-data");
      expect(handler).toHaveBeenCalledTimes(1);
    });

    it("should call handler with event type and spread arguments", () => {
      const event = new CustomEvent("test-event", {
        detail: { _spreadArgs: true, args: ["arg1", "arg2", "arg3"] },
      });

      handleCustomCatchAllEventWithNoAck(event, handler);

      expect(handler).toHaveBeenCalledWith(
        "test-event",
        "arg1",
        "arg2",
        "arg3",
      );
      expect(handler).toHaveBeenCalledTimes(1);
    });

    it("should handle falsy values as valid single arguments", () => {
      // Test 0
      const event1 = new CustomEvent("test-event", { detail: 0 });
      handleCustomCatchAllEventWithNoAck(event1, handler);
      expect(handler).toHaveBeenCalledWith("test-event", 0);

      // Test false
      handler.mockClear();
      const event2 = new CustomEvent("test-event", { detail: false });
      handleCustomCatchAllEventWithNoAck(event2, handler);
      expect(handler).toHaveBeenCalledWith("test-event", false);

      // Test empty string
      handler.mockClear();
      const event3 = new CustomEvent("test-event", { detail: "" });
      handleCustomCatchAllEventWithNoAck(event3, handler);
      expect(handler).toHaveBeenCalledWith("test-event", "");
    });

    it("should handle complex objects as single arguments", () => {
      const complexObject = {
        nested: { value: 42 },
        array: [1, 2, 3],
        func: () => "test",
      };
      const event = new CustomEvent("test-event", { detail: complexObject });

      handleCustomCatchAllEventWithNoAck(event, handler);

      expect(handler).toHaveBeenCalledWith("test-event", complexObject);
    });

    it("should handle arrays as single arguments when not marked as spreadArgs", () => {
      const arrayData = [1, 2, 3];
      const event = new CustomEvent("test-event", { detail: arrayData });

      handleCustomCatchAllEventWithNoAck(event, handler);

      expect(handler).toHaveBeenCalledWith("test-event", arrayData);
    });

    it("should handle empty spread args", () => {
      const event = new CustomEvent("test-event", {
        detail: { _spreadArgs: true, args: [] },
      });

      handleCustomCatchAllEventWithNoAck(event, handler);

      expect(handler).toHaveBeenCalledWith("test-event");
    });

    it("should return the result of the handler", () => {
      handler.mockReturnValue("handler-result");
      const event = new CustomEvent("test-event", { detail: "data" });

      const result = handleCustomCatchAllEventWithNoAck(event, handler);

      expect(result).toBe("handler-result");
    });

    it("should handle different event type formats", () => {
      const eventTypes = [
        "simple",
        "event:with:colons",
        "event-with-dashes",
        "event_with_underscores",
        "123numeric",
      ];

      eventTypes.forEach((eventType) => {
        handler.mockClear();
        const event = new CustomEvent(eventType, { detail: "data" });
        handleCustomCatchAllEventWithNoAck(event, handler);
        expect(handler).toHaveBeenCalledWith(eventType, "data");
      });
    });
  });

  describe("handleCustomEventWithNoAck", () => {
    let handler: ReturnType<typeof vi.fn>;

    beforeEach(() => {
      handler = vi.fn();
    });

    it("should call handler with no arguments when detail is undefined", () => {
      const event = new CustomEvent("test-event", { detail: undefined });

      handleCustomEventWithNoAck(event, handler);

      expect(handler).toHaveBeenCalledWith();
      expect(handler).toHaveBeenCalledTimes(1);
    });

    it("should call handler with no arguments when detail is null", () => {
      const event = new CustomEvent("test-event", { detail: null });

      handleCustomEventWithNoAck(event, handler);

      expect(handler).toHaveBeenCalledWith();
      expect(handler).toHaveBeenCalledTimes(1);
    });

    it("should call handler with single argument", () => {
      const event = new CustomEvent("test-event", { detail: "test-data" });

      handleCustomEventWithNoAck(event, handler);

      expect(handler).toHaveBeenCalledWith("test-data");
      expect(handler).toHaveBeenCalledTimes(1);
    });

    it("should call handler with spread arguments", () => {
      const event = new CustomEvent("test-event", {
        detail: { _spreadArgs: true, args: ["arg1", "arg2", "arg3"] },
      });

      handleCustomEventWithNoAck(event, handler);

      expect(handler).toHaveBeenCalledWith("arg1", "arg2", "arg3");
      expect(handler).toHaveBeenCalledTimes(1);
    });

    it("should handle falsy values as valid single arguments", () => {
      // Test 0
      const event1 = new CustomEvent("test-event", { detail: 0 });
      handleCustomEventWithNoAck(event1, handler);
      expect(handler).toHaveBeenCalledWith(0);

      // Test false
      handler.mockClear();
      const event2 = new CustomEvent("test-event", { detail: false });
      handleCustomEventWithNoAck(event2, handler);
      expect(handler).toHaveBeenCalledWith(false);

      // Test empty string
      handler.mockClear();
      const event3 = new CustomEvent("test-event", { detail: "" });
      handleCustomEventWithNoAck(event3, handler);
      expect(handler).toHaveBeenCalledWith("");
    });

    it("should handle arrays as single arguments when not marked as spreadArgs", () => {
      const arrayData = [1, 2, 3];
      const event = new CustomEvent("test-event", { detail: arrayData });

      handleCustomEventWithNoAck(event, handler);

      expect(handler).toHaveBeenCalledWith(arrayData);
    });

    it("should handle empty spread args", () => {
      const event = new CustomEvent("test-event", {
        detail: { _spreadArgs: true, args: [] },
      });

      handleCustomEventWithNoAck(event, handler);

      expect(handler).toHaveBeenCalledWith();
    });

    it("should handle single argument that is an object with _spreadArgs but not the special structure", () => {
      const objectWithSpreadArgs = { _spreadArgs: false, data: "test" };
      const event = new CustomEvent("test-event", {
        detail: objectWithSpreadArgs,
      });

      handleCustomEventWithNoAck(event, handler);

      expect(handler).toHaveBeenCalledWith(objectWithSpreadArgs);
    });

    it("should return the result of the handler", () => {
      handler.mockReturnValue("handler-result");
      const event = new CustomEvent("test-event", { detail: "data" });

      const result = handleCustomEventWithNoAck(event, handler);

      expect(result).toBe("handler-result");
    });
  });

  describe("handleCustomEventWithAck", () => {
    let handler: ReturnType<typeof vi.fn>;

    beforeEach(() => {
      handler = vi.fn();
    });

    it("should call handler with no arguments when detail is undefined", () => {
      const event = new CustomEvent("test-event", { detail: undefined });

      handleCustomEventWithAck(event, handler);

      expect(handler).toHaveBeenCalledWith();
      expect(handler).toHaveBeenCalledTimes(1);
    });

    it("should call handler with no arguments when detail is null", () => {
      const event = new CustomEvent("test-event", { detail: null });

      handleCustomEventWithAck(event, handler);

      expect(handler).toHaveBeenCalledWith();
      expect(handler).toHaveBeenCalledTimes(1);
    });

    it("should call handler with single argument from detail.args", () => {
      const event = new CustomEvent("test-event", {
        detail: { ackId: "test-ack", args: "test-data" },
      });

      handleCustomEventWithAck(event, handler);

      expect(handler).toHaveBeenCalledWith("test-data");
      expect(handler).toHaveBeenCalledTimes(1);
    });

    it("should call handler with spread arguments from detail.args", () => {
      const event = new CustomEvent("test-event", {
        detail: {
          ackId: "test-ack",
          args: { _spreadArgs: true, args: ["arg1", "arg2", "arg3"] },
        },
      });

      handleCustomEventWithAck(event, handler);

      expect(handler).toHaveBeenCalledWith("arg1", "arg2", "arg3");
      expect(handler).toHaveBeenCalledTimes(1);
    });

    it("should handle falsy values in detail.args as valid arguments", () => {
      // Test 0
      const event1 = new CustomEvent("test-event", {
        detail: { ackId: "test-ack", args: 0 },
      });
      handleCustomEventWithAck(event1, handler);
      expect(handler).toHaveBeenCalledWith(0);

      // Test false
      handler.mockClear();
      const event2 = new CustomEvent("test-event", {
        detail: { ackId: "test-ack", args: false },
      });
      handleCustomEventWithAck(event2, handler);
      expect(handler).toHaveBeenCalledWith(false);

      // Test empty string
      handler.mockClear();
      const event3 = new CustomEvent("test-event", {
        detail: { ackId: "test-ack", args: "" },
      });
      handleCustomEventWithAck(event3, handler);
      expect(handler).toHaveBeenCalledWith("");
    });

    it("should handle arrays as single arguments when not marked as spreadArgs", () => {
      const arrayData = [1, 2, 3];
      const event = new CustomEvent("test-event", {
        detail: { ackId: "test-ack", args: arrayData },
      });

      handleCustomEventWithAck(event, handler);

      expect(handler).toHaveBeenCalledWith(arrayData);
    });

    it("should handle empty spread args", () => {
      const event = new CustomEvent("test-event", {
        detail: {
          ackId: "test-ack",
          args: { _spreadArgs: true, args: [] },
        },
      });

      handleCustomEventWithAck(event, handler);

      expect(handler).toHaveBeenCalledWith();
    });

    it("should handle null args property", () => {
      const event = new CustomEvent("test-event", {
        detail: { ackId: "test-ack", args: null },
      });

      handleCustomEventWithAck(event, handler);

      expect(handler).toHaveBeenCalledWith(null);
    });

    it("should handle undefined args property", () => {
      const event = new CustomEvent("test-event", {
        detail: { ackId: "test-ack", args: undefined },
      });

      handleCustomEventWithAck(event, handler);

      expect(handler).toHaveBeenCalledWith(undefined);
    });

    it("should return the result of the handler", () => {
      handler.mockReturnValue("handler-result");
      const event = new CustomEvent("test-event", {
        detail: { ackId: "test-ack", args: "data" },
      });

      const result = handleCustomEventWithAck(event, handler);

      expect(result).toBe("handler-result");
    });

    it("should handle complex objects in args", () => {
      const complexObject = {
        nested: { value: 42 },
        array: [1, 2, 3],
      };
      const event = new CustomEvent("test-event", {
        detail: { ackId: "test-ack", args: complexObject },
      });

      handleCustomEventWithAck(event, handler);

      expect(handler).toHaveBeenCalledWith(complexObject);
    });
  });

  describe("edge cases and error handling", () => {
    let handler: ReturnType<typeof vi.fn>;

    beforeEach(() => {
      handler = vi.fn();
    });

    it("should handle circular references in detail objects", () => {
      const circularObj: any = { name: "test" };
      circularObj.self = circularObj;

      const event = new CustomEvent("test-event", { detail: circularObj });

      expect(() => {
        handleCustomEventWithNoAck(event, handler);
      }).not.toThrow();

      expect(handler).toHaveBeenCalledWith(circularObj);
    });

    it("should handle very large arrays", () => {
      const largeArray = new Array(1000).fill(0).map((_, i) => i);
      const event = new CustomEvent("test-event", {
        detail: { _spreadArgs: true, args: largeArray },
      });

      expect(() => {
        handleCustomEventWithNoAck(event, handler);
      }).not.toThrow();

      expect(handler).toHaveBeenCalledWith(...largeArray);
    });

    it("should handle handlers that throw errors", () => {
      handler.mockImplementation(() => {
        throw new Error("Handler error");
      });

      const event = new CustomEvent("test-event", { detail: "data" });

      expect(() => {
        handleCustomEventWithNoAck(event, handler);
      }).toThrow("Handler error");
    });

    it("should handle non-function handlers gracefully", () => {
      const event = new CustomEvent("test-event", { detail: "data" });

      expect(() => {
        handleCustomEventWithNoAck(event, "not-a-function" as any);
      }).toThrow();
    });
  });

  describe("function comparison and behavior differences", () => {
    let handler: ReturnType<typeof vi.fn>;

    beforeEach(() => {
      handler = vi.fn();
    });

    it("should demonstrate difference between catch-all and regular handlers with no args", () => {
      const event = new CustomEvent("test-event", { detail: undefined });

      // Catch-all handler includes event type
      handleCustomCatchAllEventWithNoAck(event, handler);
      expect(handler).toHaveBeenCalledWith("test-event");

      handler.mockClear();

      // Regular handler does not include event type
      handleCustomEventWithNoAck(event, handler);
      expect(handler).toHaveBeenCalledWith();
    });

    it("should demonstrate difference between catch-all and regular handlers with args", () => {
      const event = new CustomEvent("test-event", { detail: "data" });

      // Catch-all handler includes event type as first arg
      handleCustomCatchAllEventWithNoAck(event, handler);
      expect(handler).toHaveBeenCalledWith("test-event", "data");

      handler.mockClear();

      // Regular handler does not include event type
      handleCustomEventWithNoAck(event, handler);
      expect(handler).toHaveBeenCalledWith("data");
    });

    it("should demonstrate difference between no-ack and ack handlers", () => {
      // No-ack event
      const noAckEvent = new CustomEvent("test-event", { detail: "data" });
      handleCustomEventWithNoAck(noAckEvent, handler);
      expect(handler).toHaveBeenCalledWith("data");

      handler.mockClear();

      // Ack event structure
      const ackEvent = new CustomEvent("test-event", {
        detail: { ackId: "test-ack", args: "data" },
      });
      handleCustomEventWithAck(ackEvent, handler);
      expect(handler).toHaveBeenCalledWith("data");
    });
  });
});
