import React from "react";

export default function GroupChatSide({ conversation, user, onClick }) {
  const members = conversation.members
    .filter((member) => member.id !== user.id)
    .map((member) => <span key={member.id}>{member.name}</span>);

  return <p onClick={onClick}>{members}</p>;
}
