import React, { useState, useContext } from "react";
import Conversation from "./Conversation";
import GroupChatSide from "./GroupChatSide";
import { AppContext } from "./AppContext";
import { Navigate } from "react-router-dom";

export default function Messages() {
  const [conversations, setConversations] = useState([
    {
      messages: [
        { sender_id: 1, body: "This is a message" },
        { sender_id: 3, body: "This is another message" },
      ],
      members: [
        { name: "John", id: 2 },
        { name: "Bill", id: 3 },
        { name: "Luke", id: 4 },
      ],
      id: 1,
    },
  ]);
  const [conversationId, setConversationId] = useState(null);
  const { user, loggedInStatus } = useContext(AppContext);

  const handleGroupChatSideClick = (id) => {
    setConversationId(id);
  };

  const conversationsList = conversations.map((conversation) => (
    <GroupChatSide
      key={conversation.id}
      conversation={conversation}
      user={user}
      onClick={() => handleGroupChatSideClick(conversation.id)} // Pass a function reference
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
