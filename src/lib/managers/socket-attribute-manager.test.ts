import { describe, it, expect, beforeEach } from "vitest";
import { SocketAttributeManager } from "./socket-attribute-manager";
import { SocketEventTarget } from "../target/socket-event-target";

describe("SocketAttributeManager", () => {
  let eventTarget: SocketEventTarget;
  let manager: SocketAttributeManager;

  beforeEach(() => {
    eventTarget = new SocketEventTarget();
    manager = new SocketAttributeManager(eventTarget);
  });

  it("should initialize with correct default values", () => {
    const attributes = manager.getAttributes();

    expect(attributes.active).toBe(false);
    expect(attributes.connected).toBe(false);
    expect(attributes.disconnected).toBe(true);
    expect(attributes.recovered).toBe(false);
    expect(attributes.id).toBeUndefined();
    expect(attributes.compress).toBe(true);
    expect(attributes.timeout).toBeUndefined();
    expect(attributes.io).toBeNull();
  });

  it("should get attributes correctly", () => {
    expect(manager.getAttribute("connected")).toBe(false);
    expect(manager.getAttribute("compress")).toBe(true);
  });

  it("should set attributes correctly", () => {
    expect(manager.mockAttribute("id", "socket-123")).toBe(eventTarget);
    expect(manager.getAttribute("id")).toBe("socket-123");
  });

  it("should handle connection state changes", () => {
    expect(manager.connect()).toBe(eventTarget);
    expect(manager.getAttribute("connected")).toBe(true);
    expect(manager.getAttribute("disconnected")).toBe(false);

    expect(manager.disconnect()).toBe(eventTarget);
    expect(manager.getAttribute("connected")).toBe(false);
    expect(manager.getAttribute("disconnected")).toBe(true);
    expect(manager.getAttribute("id")).toBeUndefined();
  });

  it("should have open as an alias for connect", () => {
    expect(manager.open).toBe(manager.connect);
  });

  it("should have close as an alias for disconnect", () => {
    expect(manager.close).toBe(manager.disconnect);
  });

  it("should set timeout attribute", () => {
    expect(manager.timeout(5000)).toBe(eventTarget);
    expect(manager.getAttribute("timeout")).toBe(5000);
  });

  it("should set compress attribute", () => {
    expect(manager.compress(false)).toBe(eventTarget);
    expect(manager.getAttribute("compress")).toBe(false);
  });
});
