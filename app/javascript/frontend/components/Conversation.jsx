import React, { useState } from "react";
import ReactQuill from "react-quill";
import "react-quill/dist/quill.snow.css";

export default function Conversation({
  conversation,
  user,
  handleMessageSent,
}) {
  const [message, setMessage] = useState("");
  const [notification, setNotification] = useState("");

  const messages = conversation.messages.map((msg) => {
    const className = msg.user_id === user.id ? "myMessage" : "message";
    return (
      <p
        key={msg.id}
        className={className}
        dangerouslySetInnerHTML={{ __html: msg.body }}
      ></p>
    );
  });

  const handleChange = (content) => {
    setNotification("");
    setMessage(content);
  };

  const sendMessage = () => {
    const newMessage = {
      user_id: user.id,
      body: message,
      conversation_id: conversation.id,
    };

    fetch("http://localhost:3000/messages", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(newMessage),
      credentials: "include",
      mode: "cors",
    })
      .then((response) => response.json())
      .then((data) => {
        if (data.status === "created") {
          // Check for correct status
          setNotification("Message successfully sent.");
          handleMessageSent(data.message);
        }
      })
      .catch(() => setNotification("Failed to send message"));

    setMessage("");
  };

  return (
    <div className="conversation">
      <p className="notification">{notification}</p>
      {messages}
      <ReactQuill value={message} onChange={handleChange} />
      <button onClick={sendMessage}>Send</button>
    </div>
  );
}
