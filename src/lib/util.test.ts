import { describe, it, expect } from "vitest";
import { isCustomEvent } from "./util";

describe("util.ts", () => {
  describe("isCustomEvent", () => {
    it("should return true for a CustomEvent", () => {
      const customEvent = new CustomEvent("test-event", {
        detail: { foo: "bar" },
      });

      expect(isCustomEvent(customEvent)).toBe(true);
    });

    it("should return true for objects with detail property", () => {
      const mockCustomEvent = {
        type: "test-event",
        detail: { data: "test" },
        preventDefault: () => {},
        stopPropagation: () => {},
      } as unknown as Event;

      expect(isCustomEvent(mockCustomEvent)).toBe(true);
    });

    it("should return false for regular Event objects", () => {
      const regularEvent = new Event("test-event");

      expect(isCustomEvent(regularEvent)).toBe(false);
    });

    it("should return false for objects without detail property", () => {
      const mockEvent = {
        type: "test-event",
        preventDefault: () => {},
        stopPropagation: () => {},
      } as Event;

      expect(isCustomEvent(mockEvent)).toBe(false);
    });
  });
});
