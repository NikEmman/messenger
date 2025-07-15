import React, { useState, useContext, useEffect } from "react";
import { AppContext } from "./AppContext";
import Conversation from "./Conversation";
import GroupChatSide from "./GroupChatSide";
import { Navigate } from "react-router-dom";

export default function Messages() {
  const [conversations, setConversations] = useState([]);
  const [conversationId, setConversationId] = useState(null);
  const [topic, setTopic] = useState("");
  const [formErrors, setFormErrors] = useState({});
  const { user, loggedInStatus, url } = useContext(AppContext);
  const [notification, setNotification] = useState("");

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
  };

  const handleMemberAdded = (newUser) => {
    const newConversations = conversations.map((conversation) => {
      if (conversation.id === conversationId) {
        return { ...conversation, members: [...conversation.members, newUser] };
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

      fetch(`${url}/api/conversations`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ conversation: newConversation }),
        credentials: "include",
        mode: "cors",
      })
        .then((response) => response.json())
        .then((data) => {
          if (data.status === "created") {
            setConversations([...conversations, data.conversation]);
            setTopic("");
            setFormErrors({});
          }
        })
        .catch((error) => console.error("Error creating conversation:", error));
    }
  };

  useEffect(() => {
    fetch(`${url}/api/conversations`)
      .then((response) => response.json())
      .then((data) => setConversations(data.conversations))
      .catch((error) => console.error("Error fetching conversations:", error));
  }, []);

  const onDeleteClick = (id) => {
    fetch(`${url}/api/conversations/${id}`, {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      mode: "cors",
    })
      .then((response) => {
        if (response.ok) {
          setNotification("Conversation deleted successfully");
          handleConversationDelete(id);
        } else {
          setNotification("Failed to delete conversation");
        }
      })
      .catch((error) => console.error("Error deleting conversation:", error));
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
          />
        ) : (
          <h2>Select a conversation</h2>
        )}
      </main>
      <aside>
        <div className="conversationsList">
          {conversationsList || <p>No conversations available</p>}
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
