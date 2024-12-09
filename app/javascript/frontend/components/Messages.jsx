import React, { useState, useContext, useEffect } from "react";
import Conversation from "./Conversation";
import GroupChatSide from "./GroupChatSide";
import { AppContext } from "./AppContext";
import { Navigate } from "react-router-dom";

export default function Messages() {
  const [conversations, setConversations] = useState([]);
  const [conversationId, setConversationId] = useState(null);
  const { user, loggedInStatus } = useContext(AppContext);

  const handleGroupChatSideClick = (id) => {
    setConversationId(id);
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

  useEffect(() => {
    fetch("http://localhost:3000/conversations")
      .then((response) => response.json())
      .then((data) => {
        setConversations(data.conversations);
      })
      .catch((error) => {
        console.error("Error fetching conversations:", error);
      });
  }, []);

  const conversationsList =
    conversations.length > 0 &&
    conversations.map((conversation) => (
      <GroupChatSide
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
    <>
      <main>
        {selectedConversation ? (
          <Conversation
            conversation={selectedConversation}
            user={user}
            handleMessageSent={handleMessageSent}
          />
        ) : (
          <h2>Select a conversation</h2>
        )}
      </main>
      <aside className="conversationsList">
        {conversationsList || <p>No conversations available</p>}
      </aside>
    </>
  );
}
