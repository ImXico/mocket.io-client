import { CATCH_ALL_EVENT_TYPE } from "../constants";

/**
 * A custom EventTarget implementation that allows for catch-all event listeners.
 * This class extends the built-in EventTarget class and adds support for a special
 * event type that matches all events. This allows listeners to be added for all events
 * without having to specify the event type.
 */
export class MocketioEventTarget extends EventTarget {
  /**
   * A list of catch-all event listeners that are triggered for all events.
   */
  private readonly anyListeners: Array<(event: Event) => void> = [];

  addEventListener(
    type: string,
    listener: EventListener,
    options?: AddEventListenerOptions,
  ): void {
    super.addEventListener(type, listener, options);

    if (type === CATCH_ALL_EVENT_TYPE) {
      this.anyListeners.push(listener);
    }
  }

  prependEventListener(type: string, listener: EventListener): void {
    super.addEventListener(type, listener);

    if (type === CATCH_ALL_EVENT_TYPE) {
      this.anyListeners.unshift(listener);
    }
  }

  removeEventListener(
    type: string,
    listener: EventListener,
    options?: EventListenerOptions,
  ): void {
    super.removeEventListener(type, listener, options);

    if (type === CATCH_ALL_EVENT_TYPE) {
      const index = this.anyListeners.indexOf(listener);
      if (index !== -1) {
        this.anyListeners.splice(index, 1);
      }
    }
  }

  dispatchEvent(event: Event): boolean {
    for (const listener of this.anyListeners) {
      listener.call(this, event);
    }

    return super.dispatchEvent(event);
  }
}
