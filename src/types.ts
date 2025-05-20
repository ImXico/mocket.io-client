/**
 * DOM-style handler that receives an Event object.
 */
export type InnerHandler = (event: Event) => void;

/**
 * Socket.io-style handler that receives the actual data.
 */
export type OuterHandler = (...args: any[]) => void;
