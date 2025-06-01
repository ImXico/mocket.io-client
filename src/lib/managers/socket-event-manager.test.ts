import { describe, it, expect, vi, beforeEach } from "vitest";
import { SocketEventManager } from "./socket-event-manager";
import { SocketEventTarget } from "../target/socket-event-target";

describe("SocketEventManager", () => {
  let eventTarget: SocketEventTarget;
  let manager: SocketEventManager;

  beforeEach(() => {
    eventTarget = new SocketEventTarget();
    manager = new SocketEventManager(eventTarget);
  });

  it("should register event listeners with on", () => {
    const handler = vi.fn();

    const onResult = manager.on("test-event", handler);
    expect(onResult).toBe(eventTarget);

    const event = new CustomEvent("test-event", { detail: ["test-data"] });
    eventTarget.dispatchEvent(event);

    expect(handler).toHaveBeenCalledWith("test-data");
  });

  it("should register one-time listeners with once", () => {
    const handler = vi.fn();

    const onceResult = manager.once("test-event", handler);
    expect(onceResult).toBe(eventTarget);

    const event1 = new CustomEvent("test-event", { detail: ["data1"] });
    const event2 = new CustomEvent("test-event", { detail: ["data2"] });

    eventTarget.dispatchEvent(event1);
    eventTarget.dispatchEvent(event2);

    expect(handler).toHaveBeenCalledTimes(1);
    expect(handler).toHaveBeenCalledWith("data1");
  });

  it("should remove event listeners with off", () => {
    const handler = vi.fn();

    manager.on("test-event", handler);
    manager.off("test-event", handler);

    const event = new CustomEvent("test-event", { detail: ["test-data"] });
    eventTarget.dispatchEvent(event);

    expect(handler).not.toHaveBeenCalled();
  });

  it("should return all listeners for an event", () => {
    const handler1 = vi.fn();
    const handler2 = vi.fn();

    manager.on("test-event", handler1);
    manager.on("test-event", handler2);

    const listeners = manager.listeners("test-event");
    expect(listeners.length).toBe(2);
    expect(listeners).toContain(handler1);
    expect(listeners).toContain(handler2);
  });

  it("should return empty array for non-registered events", () => {
    const listeners = manager.listeners("non-existent-event");
    expect(listeners).toEqual([]);
  });

  it("should handle various data types in event detail", () => {
    const numberHandler = vi.fn();
    const objectHandler = vi.fn();
    const arrayHandler = vi.fn();

    manager.on("number-event", numberHandler);
    manager.on("object-event", objectHandler);
    manager.on("array-event", arrayHandler);

    eventTarget.dispatchEvent(
      new CustomEvent("number-event", { detail: [42] }),
    );
    eventTarget.dispatchEvent(
      new CustomEvent("object-event", { detail: [{ key: "value" }] }),
    );
    eventTarget.dispatchEvent(
      new CustomEvent("array-event", { detail: [[1, 2, 3]] }),
    );

    expect(numberHandler).toHaveBeenCalledWith(42);
    expect(objectHandler).toHaveBeenCalledWith({ key: "value" });
    expect(arrayHandler).toHaveBeenCalledWith([1, 2, 3]);
  });
});
