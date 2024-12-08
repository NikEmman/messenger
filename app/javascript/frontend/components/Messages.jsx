import React, { useState, useContext, useEffect } from "react";
import Conversation from "./Conversation";
import GroupChatSide from "./GroupChatSide";
import { AppContext } from "./AppContext";
import { Navigate } from "react-router-dom";

export default function Messages() {
  const [conversations, setConversations] = useState([
    {
      topic: "This is the topic",
      id: 1,
    },
  ]);
  const [conversationId, setConversationId] = useState(null);
  const { user, loggedInStatus } = useContext(AppContext);

  const handleGroupChatSideClick = (id) => {
    setConversationId(id);
  };
  useEffect(() => {
    fetch("http://localhost:3000/conversations/")
      .then((response) => response.json())
      .then((data) => setConversations(data));
  }, []);
  const conversationsList = conversations.map((conversation) => (
    <GroupChatSide
      key={conversation.id}
      conversation={conversation}
      user={user}
      onClick={() => handleGroupChatSideClick(conversation.id)}
    />
  ));

  const selectedConversation = conversations.find(
    (conversation) => conversation.id === conversationId
  );

  if (loggedInStatus === "NOT_LOGGED_IN") {
    return <Navigate to="/" replace />;
  }

  return (
    <>
      <main>
        {selectedConversation ? (
          <Conversation conversation={selectedConversation} user={user} />
        ) : (
          <h2>Select a conversation</h2>
        )}
      </main>
      <aside className="conversationsList">{conversationsList}</aside>
    </>
  );
}
