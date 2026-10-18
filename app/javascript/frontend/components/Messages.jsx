import React, { useState, useContext, useEffect } from "react";
import { AppContext } from "./AppContext";
import Conversation from "./Conversation";
import GroupChatSide from "./GroupChatSide";
import Spinner from "./Spinner";
import { Navigate } from "react-router-dom";
import { api } from "../api";

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

  const handleGroupChatSideClick = (id) => {
    setNotification("");
    setConversationId(id);
  };

  const handleNotificationChange = (newNotification) => {
    setNotification(newNotification);
  };

  const handleMessageSent = (message) => {
    const newConversations = conversations.map((conversation) => {
      if (conversation.id === conversationId) {
        return {
          ...conversation,
          messages: [...conversation.messages, message],
        };
      }
      return conversation;
    });
    setConversations(newConversations);
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
          setConversations([...conversations, data.conversation]);
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
