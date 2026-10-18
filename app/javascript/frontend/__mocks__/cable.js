// Manual mock used by `jest.mock("../cable")`. Tests push server events with emit().
const listeners = new Set();

export const connectInbox = jest.fn();
export const disconnectInbox = jest.fn();
export const sendTyping = jest.fn();

export function onInboxEvent(listener) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

export function emit(event) {
  listeners.forEach((listener) => listener(event));
}
