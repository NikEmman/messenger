import React from "react";

export default function GroupChat({ conversation }) {
  const members = conversation.members.map((member) => (
    <span>{member.name}</span>
  ));
  return <p>{members}</p>;
}
