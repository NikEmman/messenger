import React from "react";

export default function Conversation({ conversation, user }) {
  const messages = conversation.map((message) => {
    const className = message.profile_id === user.id ? "myMessage" : "message";
    return <p className={className}>{message.body}</p>;
  });

  return <div className="conversation">{messages}</div>;
}
