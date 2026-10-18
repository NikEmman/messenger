import React, { useState, useContext, useEffect, useRef } from "react";
import { AppContext } from "./AppContext";
import Conversation from "./Conversation";
import GroupChatSide from "./GroupChatSide";
import Spinner from "./Spinner";
import { Navigate } from "react-router-dom";
import { api } from "../api";
import { onInboxEvent } from "../cable";

// Plain-text preview of message HTML, keeping line breaks as spaces.
function htmlToText(html) {
  const spaced = (html || "").replace(/<br\s*\/?>|<\/(div|p|li|h\d|blockquote|pre)>/gi, " ");
  return new DOMParser().parseFromString(spaced, "text/html").body.textContent.replace(/\s+/g, " ").trim();
}

export default function Messages() {
  const [conversations, setConversations] = useState([]);
  const [conversationsLoading, setConversationsLoading] = useState(true);
  const [conversationId, setConversationId] = useState(null);
  const [topic, setTopic] = useState("");
  const [formErrors, setFormErrors] = useState({});
  const { user, loggedInStatus } = useContext(AppContext);
  // { text, kind: "info" | "error" } shown as a toast
  const [notification, setNotification] = useState(null);
  const [onlineUserIds, setOnlineUserIds] = useState(() => new Set());
  // The open conversation, readable from socket callbacks without re-subscribing.
  const openConversationId = useRef(null);
  openConversationId.current = conversationId;

  // Auto-dismiss notifications after 4 seconds
  useEffect(() => {
    if (!notification) return;
    const timer = setTimeout(() => setNotification(null), 4000);
    return () => clearTimeout(timer);
  }, [notification]);

  const updateConversation = (id, changes) =>
    setConversations((prev) => prev.map((c) => (c.id === id ? { ...c, ...changes } : c)));

  const handleGroupChatSideClick = (id) => {
    notify(null);
    setConversationId(id);
    updateConversation(id, { unread_count: 0 });
    api.post(`/api/conversations/${id}/read`).catch(() => {});
  };

  const notify = (text, kind = "info") => setNotification(text ? { text, kind } : null);
  const handleNotificationChange = notify;

  // Refresh the sidebar preview, move the conversation to the top and count it
  // as unread if it arrived somewhere the user isn't looking.
  const handleMessageSent = (message) => {
    const isOpen = message.conversation_id === openConversationId.current;
    const isOwn = message.user_id === user.id;
    setConversations((prev) => {
      const target = prev.find((c) => c.id === message.conversation_id);
      if (!target || (target.last_message && target.last_message.id >= message.id)) return prev;
      const updated = {
        ...target,
        last_message: {
          id: message.id,
          user_id: message.user_id,
          preview: htmlToText(message.body),
          created_at: message.created_at,
        },
        unread_count: isOpen || isOwn ? 0 : (target.unread_count || 0) + 1,
      };
      return [updated, ...prev.filter((c) => c.id !== target.id)];
    });
    if (isOpen && !isOwn) {
      api.post(`/api/conversations/${message.conversation_id}/read`).catch(() => {});
    }
  };

  // Live updates pushed by the server over Action Cable
  useEffect(
    () =>
      onInboxEvent((event) => {
        switch (event.type) {
          case "message":
            handleMessageSent(event.message);
            break;
          case "presence":
            setOnlineUserIds((prev) => {
              const next = new Set(prev);
              if (event.online) next.add(event.user_id);
              else next.delete(event.user_id);
              return next;
            });
            break;
          case "conversation_added":
            setConversations((prev) =>
              prev.some((c) => c.id === event.conversation.id)
                ? prev
                : [event.conversation, ...prev]
            );
            break;
          case "conversation_removed":
            setConversations((prev) => prev.filter((c) => c.id !== event.conversation_id));
            if (openConversationId.current === event.conversation_id) {
              setConversationId(null);
              notify("This conversation is no longer available");
            }
            break;
          case "member_added":
            setConversations((prev) =>
              prev.map((c) =>
                c.id === event.conversation_id && !c.members.some((m) => m.id === event.member.id)
                  ? { ...c, members: [...c.members, event.member] }
                  : c
              )
            );
            break;
          case "member_removed":
            setConversations((prev) =>
              prev.map((c) =>
                c.id === event.conversation_id
                  ? { ...c, members: c.members.filter((m) => m.id !== event.user_id) }
                  : c
              )
            );
            break;
        }
      }),
    [user.id]
  );

  const handleConversationDelete = (id) => {
    const newConversations = conversations.filter(
      (conversation) => conversation.id !== id
    );
    setConversations(newConversations);
    if (conversationId === id) {
      setConversationId(null);
    }
  };

  const handleMemberAdded = (newMember) => {
    const newConversations = conversations.map((conversation) => {
      if (conversation.id === conversationId) {
        return { ...conversation, members: [...conversation.members, newMember] };
      }
      return conversation;
    });
    setConversations(newConversations);
  };

  const handleMemberRemoved = (removedUserId) => {
    const newConversations = conversations.map((conversation) => {
      if (conversation.id === conversationId) {
        return {
          ...conversation,
          members: conversation.members.filter((member) => member.id !== removedUserId),
        };
      }
      return conversation;
    });
    setConversations(newConversations);
  };

  const validateForm = (data) => {
    const errors = {};
    if (!data.topic.trim()) {
      errors.topic = "Conversation topic is required";
    }
    return errors;
  };

  const handleNewConversation = () => {
    const newErrors = validateForm({ topic });
    setFormErrors(newErrors);

    if (Object.keys(newErrors).length === 0) {
      const newConversation = {
        topic: topic,
      };

      api
        .post("/api/conversations", { conversation: newConversation })
        .then((data) => {
          setConversations([data.conversation, ...conversations]);
          setTopic("");
          setFormErrors({});
        })
        .catch(() => notify("Failed to create conversation", "error"));
    }
  };

  useEffect(() => {
    api
      .get("/api/conversations")
      .then((data) => {
        setConversations(data.conversations);
        setOnlineUserIds(
          new Set(
            data.conversations.flatMap((c) => c.members.filter((m) => m.online).map((m) => m.id))
          )
        );
      })
      .catch((error) => console.error("Error fetching conversations:", error))
      .finally(() => setConversationsLoading(false));
  }, []);

  const onDeleteClick = (id) => {
    api
      .delete(`/api/conversations/${id}`)
      .then(() => {
        notify("Conversation deleted successfully");
        handleConversationDelete(id);
      })
      .catch(() => notify("Failed to delete conversation", "error"));
  };

  const conversationsList =
    conversations.length > 0 &&
    conversations.map((conversation) => (
      <GroupChatSide
        onDeleteClick={() => onDeleteClick(conversation.id)}
        key={conversation.id}
        conversation={conversation}
        user={user}
        onClick={() => handleGroupChatSideClick(conversation.id)}
        isActive={conversation.id === conversationId}
        onlineUserIds={onlineUserIds}
      />
    ));

  const selectedConversation =
    conversations.length > 0 &&
    conversations.find((conversation) => conversation.id === conversationId);

  if (loggedInStatus === "NOT_LOGGED_IN") {
    return <Navigate to="/" replace />;
  }

  return (
    <div className="mainContainer">
      <main>
        {notification && (
          <div className={`toast ${notification.kind}`} role="status">
            <span>{notification.text}</span>
            <button className="toastClose" onClick={() => notify(null)} aria-label="Dismiss">
              ✕
            </button>
          </div>
        )}
        {selectedConversation ? (
          <Conversation
            handleNotificationChange={handleNotificationChange}
            conversation={selectedConversation}
            user={user}
            handleMessageSent={handleMessageSent}
            handleMemberAdded={handleMemberAdded}
            handleMemberRemoved={handleMemberRemoved}
            handleConversationDeleted={handleConversationDelete}
            onlineUserIds={onlineUserIds}
          />
        ) : (
          <div className="emptyState">
            <div className="emptyStateIcon" aria-hidden="true">💬</div>
            <h2>Select a conversation</h2>
            <p>
              {conversations.length > 0
                ? "Pick a conversation on the left to start chatting."
                : "Start a new conversation from the sidebar, then add people to it."}
            </p>
          </div>
        )}
      </main>
      <aside>
        <div className="conversationsList">
          {conversationsLoading ? (
            <Spinner label="Loading conversations..." className="sidebarSpinner" />
          ) : (
            conversationsList || <p>No conversations yet. Start one below!</p>
          )}
        </div>
        <div className="newConv">
          <input
            type="text"
            value={topic}
            onChange={(e) => {
              setTopic(e.target.value);
              notify(null);
              setFormErrors({});
            }}
            placeholder="Conversation Topic"
          />
          {formErrors.topic && (
            <span className="error-message">{formErrors.topic}</span>
          )}
          <button onClick={handleNewConversation}>
            Start New Conversation
          </button>
        </div>
      </aside>
    </div>
  );
}
