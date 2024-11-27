import React, { useState, useEffect } from "react";
import GroupChat from "./GroupChat";

export default function Home() {
  const [conversations, setConversations] = useState([]);
  const [user, setUser] = useState(null);

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
    <GroupChat conversation={conversation} />
  ));

  return (
    <>
      <main></main>
      <aside className="conversationsList">{conversationsList}</aside>
    </>
  );
}
