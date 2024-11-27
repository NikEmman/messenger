import React, { useState, useEffect } from "react";
import GroupChatSide from "./GroupChatSide";

export default function Home() {
  const [conversations, setConversations] = useState([]);
  const [user, setUser] = useState(null);
  const [conversationId, setConversationId] = useState(null);

  useEffect(() => {
    const url = "http://localhost:3000/api/profile:id";
    fetch(url)
      .then((response) => response.json())
      .then((data) => setUser(data));
  }, []);

  useEffect(() => {
    fetch("http://localhost:3000/api/conversations/")
      .then((response) => response.json())
      .then((data) => setConversations(data))
      .catch((error) => console.error("Error fetching data", error));
  }, [user]);

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
  return (
    <>
      <main>
        {conversationId ? <Conversation /> : <h2>No conversation selected!</h2>}
      </main>
      <aside className="conversationsList">{conversationsList}</aside>
    </>
  );
}
