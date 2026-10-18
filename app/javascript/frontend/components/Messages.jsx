import React, { useState, useContext, useEffect } from "react";
import { AppContext } from "./AppContext";
import Conversation from "./Conversation";
import GroupChatSide from "./GroupChatSide";
import Spinner from "./Spinner";
import { Navigate } from "react-router-dom";
import { api } from "../api";

function htmlToText(html) {
  return new DOMParser().parseFromString(html || "", "text/html").body.textContent.trim();
}

export default function Messages() {
  const [conversations, setConversations] = useState([]);
  const [conversationsLoading, setConversationsLoading] = useState(true);
  const [conversationId, setConversationId] = useState(null);
  const [topic, setTopic] = useState("");
  const [formErrors, setFormErrors] = useState({});
  const { user, loggedInStatus } = useContext(AppContext);
  const [notification, setNotification] = useState("");

  // Auto-dismiss notifications after 4 seconds
  useEffect(() => {
    if (!notification) return;
    const timer = setTimeout(() => setNotification(""), 4000);
    return () => clearTimeout(timer);
  }, [notification]);

  const updateConversation = (id, changes) =>
    setConversations((prev) => prev.map((c) => (c.id === id ? { ...c, ...changes } : c)));

  const handleGroupChatSideClick = (id) => {
    setNotification("");
    setConversationId(id);
    updateConversation(id, { unread_count: 0 });
    api.post(`/api/conversations/${id}/read`).catch(() => {});
  };

  const handleNotificationChange = (newNotification) => {
    setNotification(newNotification);
  };

  // Refresh the sidebar preview and move the conversation to the top
  const handleMessageSent = (message) => {
    setConversations((prev) => {
      const target = prev.find((c) => c.id === message.conversation_id);
      if (!target) return prev;
      const updated = {
        ...target,
        last_message: {
          id: message.id,
          user_id: message.user_id,
          preview: htmlToText(message.body),
          created_at: message.created_at,
        },
      };
      return [updated, ...prev.filter((c) => c.id !== target.id)];
    });
  };

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
        .catch(() => setNotification("Failed to create conversation"));
    }
  };

  useEffect(() => {
    api
      .get("/api/conversations")
      .then((data) => setConversations(data.conversations))
      .catch((error) => console.error("Error fetching conversations:", error))
      .finally(() => setConversationsLoading(false));
  }, []);

  const onDeleteClick = (id) => {
    api
      .delete(`/api/conversations/${id}`)
      .then(() => {
        setNotification("Conversation deleted successfully");
        handleConversationDelete(id);
      })
      .catch(() => setNotification("Failed to delete conversation"));
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
        {notification && <p className="notification">{notification}</p>}
        {selectedConversation ? (
          <Conversation
            handleNotificationChange={handleNotificationChange}
            conversation={selectedConversation}
            user={user}
            handleMessageSent={handleMessageSent}
            handleMemberAdded={handleMemberAdded}
            handleMemberRemoved={handleMemberRemoved}
            handleConversationDeleted={handleConversationDelete}
          />
        ) : (
          <h2>Select a conversation</h2>
        )}
      </main>
      <aside>
        <div className="conversationsList">
          {conversationsLoading ? (
            <Spinner label="Loading conversations..." className="sidebarSpinner" />
          ) : (
            conversationsList || <p>No conversations available</p>
          )}
        </div>
        <div className="newConv">
          <input
            type="text"
            value={topic}
            onChange={(e) => {
              setTopic(e.target.value);
              setNotification("");
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
