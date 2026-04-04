import React from "react";
import "../styles/GroupChatSide.css";

function formatPreviewTime(timestamp) {
  if (!timestamp) return "";
  const date = new Date(timestamp);
  const now = new Date();
  const diffMs = now - date;
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMins < 1) return "now";
  if (diffMins < 60) return `${diffMins}m`;
  if (diffHours < 24) return `${diffHours}h`;
  if (diffDays === 1) return "1d";
  if (diffDays < 7) return `${diffDays}d`;
  return date.toLocaleDateString(undefined, { month: "short", day: "numeric" });
}

function stripHtml(html) {
  return html?.replace(/<[^>]*>/g, "").trim() || "";
}

export default function GroupChatSide({ onDeleteClick, conversation, user, onClick, isActive }) {
  const otherMembers = conversation.members.filter((m) => m.id !== user.id);
  const maxVisibleAvatars = 5;
  const visibleMembers = otherMembers.slice(0, maxVisibleAvatars);
  const overflowCount = otherMembers.length - maxVisibleAvatars;

  const msgs = conversation.messages || [];
  const lastMessage = msgs[msgs.length - 1];
  const lastSender = lastMessage
    ? conversation.members.find((m) => m.id === lastMessage.user_id)
    : null;
  const preview = lastMessage
    ? `${lastSender?.name || lastSender?.email || "Someone"}: ${stripHtml(lastMessage.body)}`
    : "No messages yet";

  return (
    <div className={`groupChat${isActive ? " active" : ""}`}>
      <div className="groupChatContent" onClick={onClick}>
        <div className="groupChatTopRow">
          <div className="stackedAvatars">
            {visibleMembers.map((member, index) => (
              <img
                key={member.id}
                width="22px"
                src={member.avatar_url}
                alt={member.name || member.email}
                className="stackedAvatar"
                style={{ zIndex: visibleMembers.length - index }}
              />
            ))}
            {overflowCount > 0 && (
              <span className="avatarOverflow">+{overflowCount}</span>
            )}
          </div>
          <div className="groupChatMeta">
            <span className="groupChatTopic">{conversation.topic}</span>
            {lastMessage?.created_at && (
              <span className="groupChatTime">
                {formatPreviewTime(lastMessage.created_at)}
              </span>
            )}
          </div>
        </div>
        <p className="groupChatPreview">{preview}</p>
      </div>
      <button
        className="deleteBtn"
        onClick={(e) => {
          e.stopPropagation();
          onDeleteClick();
        }}
        title="Delete conversation"
      >
        ✕
      </button>
    </div>
  );
}
