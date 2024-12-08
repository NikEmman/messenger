import React, { useEffect, useState } from "react";

export default function Conversation({ conversationId, user }) {
  const [message, setMessage] = useState("");
  const [conversation, setConversation] = useState({});
  const [notification, setNotification] = useState("");

  const messages = conversation.messages.map((msg) => {
    const className = msg.sender_id === user.id ? "myMessage" : "message";
    return (
      <p key={msg.body} className={className}>
        {msg.body}
      </p>
    );
  });

  const handleChange = (e) => {
    setNotification("");
    setMessage(e.target.value);
  };

  const sendMessage = () => {
    // data = {
    //   sender_id: user.id,
    //   body: message,
    //   conversation_id: conversation.id,
    // };
    // fetch("http://localhost/conversations", {
    //   method: "POST",
    //   headers: { "Content-Type": "application/json" },
    //   body: JSON.stringify(data),
    //   credentials: "include",
    //   mode: "cors",
    // })
    //   .then(response.json())
    //   .then((data) => {
    //     if (data.response === "ok") {
    //       setNotification("Message successfully sent.");
    //     }
    //   });
    console.log("Message sent");
    setMessage("");
  };

  return (
    <div className="conversation">
      <p className="notification">{notification}</p>
      {messages}
      <input
        type="text"
        name="message"
        id="message"
        onChange={handleChange}
        value={message}
      />
      <button onClick={sendMessage}>Send</button>
    </div>
  );
}
