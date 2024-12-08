import React from "react";

export default function GroupChatSide({ conversation, user, onClick }) {
  const members = conversation.members.map((member) => (
    <span key={member.id}>{member.name}</span>
  ));

  return (
    <p className="groupChat" onClick={onClick}>
      {members}
    </p>
  );
}
