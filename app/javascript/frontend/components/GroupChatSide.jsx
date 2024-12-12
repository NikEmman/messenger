import React from "react";

export default function GroupChatSide({ conversation, user, onClick }) {
  const members = conversation.members.map((member) => {
    if (member.id !== user.id) {
      return <span key={member.id}>{member.name}</span>;
    }
    if (!conversation.topic && conversation.members.length === 1) {
      return <span key={member.id}>{member.name}</span>;
    }
  });

  return (
    <p className="groupChat" onClick={onClick}>
      {conversation.topic || members}
    </p>
  );
}
