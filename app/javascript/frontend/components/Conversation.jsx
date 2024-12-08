import React, { useEffect, useState } from "react";
import ReactQuill from "react-quill";
import "react-quill/dist/quill.snow.css";

export default function Conversation({ conversation, user }) {
  const [message, setMessage] = useState("");
  const [notification, setNotification] = useState("");

  const messages = conversation.messages.map((msg) => {
    const className = msg.user_id === user.id ? "myMessage" : "message";
    return (
      <p
        key={msg.body}
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
    // data = {
    //   user_id: user.id,
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
      <ReactQuill value={message} onChange={handleChange} />
      <button onClick={sendMessage}>Send</button>
    </div>
  );
}
