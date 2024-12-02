import React, { useState, useContext } from "react";
import Conversation from "./Conversation";
import GroupChatSide from "./GroupChatSide";
import { AppContext } from "./AppContext";
import { Navigate } from "react-router-dom";

export default function Messages() {
  const [conversations, setConversations] = useState([]);
  const [conversationId, setConversationId] = useState(null);
  const { user, loggedInStatus } = useContext(AppContext);

  const conversationsList = conversations.map((conversation) => (
    <GroupChatSide
      key={conversation.id}
      conversation={conversation}
      user={user}
      onClick={handleGroupChatSideClick}
    />
  ));
  const handleGroupChatSideClick = (id) => {
    setConversationId(id);
  };
  const selectedConversation =
    conversationId &&
    conversations.filter((conversation) => conversation.id === conversationId);

  if (loggedInStatus === "NOT_LOGGED_IN") {
    return <Navigate to="/" replace />;
  }
  return (
    <>
      <main>
        {conversationId ? <Conversation /> : <h2>No conversation selected!</h2>}
      </main>
      <aside className="conversationsList">{conversationsList}</aside>
    </>
  );
}
