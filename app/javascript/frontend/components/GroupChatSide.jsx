import React from "react";
import "../styles/GroupChatSide.css";

export default function GroupChatSide({
  onDeleteClick,
  conversation,
  user,
  onClick,
}) {
  // Get other members (exclude current user)
  const otherMembers = conversation.members.filter(
    (member) => member.id !== user.id
  );

  // For small stacked avatars (show up to 5)
  const maxVisibleAvatars = 5;
  const visibleMembers = otherMembers.slice(0, maxVisibleAvatars);
  const overflowCount = otherMembers.length - maxVisibleAvatars;

  return (
    <div className="groupChat">
      <div className="groupChatContent" onClick={onClick}>
        <div className="stackedAvatars">
          {visibleMembers.map((member, index) => (
            <img
              key={member.id}
              width={"24px"}
              src={member.avatar_url}
              alt={member.name || member.email}
              className="stackedAvatar"
              style={{
                zIndex: visibleMembers.length - index,
                marginLeft: index > 0 ? "-12px" : "0",
              }}
            />
          ))}
          {overflowCount > 0 && (
            <span className="avatarOverflow">+{overflowCount}</span>
          )}
        </div>
        <p className="groupChatTopic">{conversation.topic}</p>
      </div>
      <button
        className="deleteBtn"
        onClick={(e) => {
          e.stopPropagation();
          onDeleteClick();
        }}
      >
        Del
      </button>
    </div>
  );
}
