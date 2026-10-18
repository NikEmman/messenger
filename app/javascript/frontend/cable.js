import { createConsumer } from "@rails/actioncable";

// A single InboxChannel subscription per logged-in session. Components listen
// for its events with onInboxEvent() rather than opening their own sockets.
const HEARTBEAT_MS = 30000;

let consumer = null;
let subscription = null;
let heartbeat = null;
const listeners = new Set();

export function connectInbox() {
  if (subscription) return;
  consumer = createConsumer();
  subscription = consumer.subscriptions.create("InboxChannel", {
    connected() {
      clearInterval(heartbeat);
      heartbeat = setInterval(() => subscription?.perform("appear"), HEARTBEAT_MS);
    },
    disconnected() {
      clearInterval(heartbeat);
    },
    received(event) {
      listeners.forEach((listener) => listener(event));
    },
  });
}

// Call on logout: the socket is authenticated by the session it opened with.
export function disconnectInbox() {
  clearInterval(heartbeat);
  consumer?.disconnect();
  consumer = null;
  subscription = null;
}

export function onInboxEvent(listener) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

export function sendTyping(conversationId) {
  subscription?.perform("typing", { conversation_id: conversationId });
}
