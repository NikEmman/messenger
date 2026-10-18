import React, { useState, useRef, useEffect, useLayoutEffect } from "react";
import "../styles/Conversation.css";
import ReactQuill from "react-quill";
import { Link } from "react-router-dom";
import "react-quill/dist/quill.snow.css";
import { api } from "../api";
import Spinner from "./Spinner";

function formatTime(timestamp) {
  if (!timestamp) return "";
  const date = new Date(timestamp);
  const now = new Date();
  const diffMs = now - date;
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMins < 1) return "just now";
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays === 1) return "yesterday";
  if (diffDays < 7) return `${diffDays}d ago`;
  return date.toLocaleDateString(undefined, { month: "short", day: "numeric" });
}

function isEditorEmpty(html) {
  return html.replace(/<[^>]*>/g, "").trim() === "";
}

export default function Conversation({
  handleNotificationChange,
  conversation,
  user,
  handleMessageSent,
  handleMemberAdded,
  handleMemberRemoved,
  handleConversationDeleted,
}) {
  const [message, setMessage] = useState("");
  const [showUserList, setShowUserList] = useState(false);
  const [searchText, setSearchText] = useState("");
  const [selection, setSelection] = useState(null);
  const [userList, setUserList] = useState([]);
  const [removingId, setRemovingId] = useState(null);
  const [messages, setMessages] = useState([]);
  const [hasMore, setHasMore] = useState(false);
  const [messagesLoading, setMessagesLoading] = useState(true);
  const [loadingOlder, setLoadingOlder] = useState(false);
  const dialogRef = useRef(null);
  const messagesRef = useRef(null);
  const messagesEndRef = useRef(null);
  // Distance from the bottom to restore after prepending older messages.
  const scrollAnchor = useRef(null);
  // Whether the view should follow new messages (true while near the bottom).
  const stickToBottom = useRef(true);

  // Load the newest page of messages whenever the conversation changes
  useEffect(() => {
    let cancelled = false;
    setMessages([]);
    setHasMore(false);
    setMessagesLoading(true);
    api
      .get(`/api/conversations/${conversation.id}/messages`)
      .then((data) => {
        if (cancelled) return;
        stickToBottom.current = true;
        setMessages(data.messages);
        setHasMore(data.has_more);
      })
      .catch(() => !cancelled && handleNotificationChange("Failed to load messages"))
      .finally(() => !cancelled && setMessagesLoading(false));
    return () => {
      cancelled = true;
    };
  }, [conversation.id]);

  // Keep the scroll position sensible as messages are added
  useLayoutEffect(() => {
    const el = messagesRef.current;
    if (el && scrollAnchor.current !== null) {
      el.scrollTop = el.scrollHeight - scrollAnchor.current;
      scrollAnchor.current = null;
    } else if (stickToBottom.current) {
      messagesEndRef.current?.scrollIntoView?.({ block: "end" });
    }
  }, [messages]);

  const loadOlderMessages = () => {
    if (!hasMore || loadingOlder || messages.length === 0) return;
    setLoadingOlder(true);
    api
      .get(`/api/conversations/${conversation.id}/messages?before=${messages[0].id}`)
      .then((data) => {
        const el = messagesRef.current;
        if (el) scrollAnchor.current = el.scrollHeight - el.scrollTop;
        setMessages((prev) => [...data.messages, ...prev]);
        setHasMore(data.has_more);
      })
      .catch(() => handleNotificationChange("Failed to load older messages"))
      .finally(() => setLoadingOlder(false));
  };

  const handleMessagesScroll = (e) => {
    const el = e.currentTarget;
    stickToBottom.current = el.scrollHeight - el.scrollTop - el.clientHeight < 80;
    if (el.scrollTop < 80) loadOlderMessages();
  };

  // Search users (debounced) while the "Add user" picker is open
  useEffect(() => {
    if (!showUserList) return;
    const timer = setTimeout(() => {
      const query = searchText.trim();
      api
        .get(`/api/users${query ? `?q=${encodeURIComponent(query)}` : ""}`)
        .then((data) => setUserList(data.users))
        .catch(() => handleNotificationChange("Failed to load users"));
    }, 250);
    return () => clearTimeout(timer);
  }, [searchText, showUserList]);

  const messageList =
    messages.length > 0 ? (
      messages.map((msg) => {
        const isOwn = msg.user_id === user.id;
        const className = isOwn ? "myMessage" : "message";
        const member = conversation.members.find((m) => m.id === msg.user_id);

        return (
          <div key={msg.id || msg.body} className={"messageContainer " + className}>
            <Link to={`/profile/${msg.user_id}`}>
              <img src={member && member.avatar_url} alt="Avatar" />
            </Link>
            <div className="messageBubbleWrapper">
              <p dangerouslySetInnerHTML={{ __html: msg.body }} />
              {msg.created_at && (
                <span className="messageTime">{formatTime(msg.created_at)}</span>
              )}
            </div>
          </div>
        );
      })
    ) : messagesLoading ? (
      <Spinner label="Loading messages..." />
    ) : (
      <h2>No messages yet — say hello!</h2>
    );

  const handleMessageChange = (content) => {
    handleNotificationChange("");
    setMessage(content);
  };

  const participants = conversation.members.map((member) => (
    <span key={member.id}>{member.name || member.email}</span>
  ));

  const onAddUserClick = () => {
    handleNotificationChange("");
    setShowUserList(true);
  };

  const openMembersModal = () => {
    dialogRef.current?.showModal();
  };

  const closeMembersModal = () => {
    dialogRef.current?.close();
  };

  const sendMessage = () => {
    if (isEditorEmpty(message)) return;

    api
      .post(`/api/conversations/${conversation.id}/messages`, {
        message: { body: message },
      })
      .then((data) => {
        stickToBottom.current = true;
        setMessages((prev) => [...prev, data.message]);
        handleNotificationChange("Message successfully sent.");
        handleMessageSent(data.message);
      })
      .catch(() => handleNotificationChange("Failed to send message"));

    setMessage("");
  };

  const onSearchChange = (e) => setSearchText(e.target.value);

  const onCancelClick = () => {
    setSelection(null);
    setShowUserList(false);
  };

  const filteredUsers = userList
    .filter((u) => !conversation.members.some((member) => member.id === u.id))
    .map((u) => (
      <option key={u.id} value={u.id}>
        {u.name || u.email}
      </option>
    ));

  const handleAddUser = () => {
    const memberData = { conversation_id: conversation.id, user_id: selection };
    api
      .post("/api/conversation_users", memberData)
      .then((data) => {
        handleNotificationChange("Added member");
        handleMemberAdded(data.member);
        setUserList(userList.filter((u) => u.id !== selection));
        setShowUserList(false);
      })
      .catch(() => handleNotificationChange("Failed to add member"));
  };

  const handleRemoveMember = (membershipId, memberName) => {
    if (!window.confirm(`Remove ${memberName} from this conversation?`)) return;
    setRemovingId(membershipId);

    api
      .delete(`/api/conversation_users/${membershipId}`)
      .then((data) => {
        if (data.conversation_deleted) {
          handleNotificationChange("Conversation deleted (no members remaining)");
          handleConversationDeleted(conversation.id);
          closeMembersModal();
        } else {
          handleNotificationChange("Member removed");
          handleMemberRemoved(data.removed_user_id);
        }
      })
      .catch(() => handleNotificationChange("Failed to remove member"))
      .finally(() => setRemovingId(null));
  };

  const handleLeaveConversation = () => {
    if (!window.confirm("Leave this conversation?")) return;

    const currentUserMembership = conversation.members.find(
      (member) => member.id === user.id
    );
    if (!currentUserMembership) return;

    setRemovingId(currentUserMembership.membership_id);

    api
      .delete(`/api/conversation_users/${currentUserMembership.membership_id}`)
      .then(() => {
        handleConversationDeleted(conversation.id);
        closeMembersModal();
      })
      .catch(() => handleNotificationChange("Failed to leave conversation"))
      .finally(() => setRemovingId(null));
  };

  // Ctrl+Enter to send
  const handleKeyDown = (e) => {
    if ((e.ctrlKey || e.metaKey) && e.key === "Enter") {
      e.preventDefault();
      sendMessage();
    }
  };

  const canSend = !isEditorEmpty(message);

  const userSelection = (
    <div className="userSelectionForm">
      <input
        placeholder="Search users"
        onChange={onSearchChange}
        value={searchText}
      />
      <select
        name="users"
        id="users"
        onChange={(e) => setSelection(e.target.value)}
        size="5"
      >
        {filteredUsers}
      </select>
      {selection && (
        <button className="smallBtn" onClick={handleAddUser}>
          Add
        </button>
      )}
      <button className="smallBtn" onClick={onCancelClick}>
        Cancel
      </button>
    </div>
  );

  return (
    <div className="conversation">
      <div className="conversationHeader">
        <p className="topic">{conversation.topic}</p>
        <p className="members">{participants}</p>
        {showUserList ? (
          userSelection
        ) : (
          <div className="headerButtons">
            <button className="smallBtn" onClick={onAddUserClick}>
              Add user
            </button>
            <button className="smallBtn" onClick={openMembersModal}>
              Manage members
            </button>
          </div>
        )}
      </div>

      <dialog ref={dialogRef} className="membersModal">
        <div className="membersModalContent">
          <h2>Members</h2>
          <ul className="membersList">
            {conversation.members.map((member) => (
              <li key={member.membership_id} className="memberItem">
                <div className="memberInfo">
                  <img
                    src={member.avatar_url}
                    alt={member.name || member.email}
                    className="memberAvatar"
                  />
                  <span className="memberName">
                    {member.name || member.email}
                    {member.id === user.id && " (you)"}
                  </span>
                </div>
                {member.id === user.id ? (
                  <button
                    className="leaveMemberBtn modalActionBtn"
                    onClick={handleLeaveConversation}
                    disabled={removingId === member.membership_id}
                  >
                    {removingId === member.membership_id ? "Leaving..." : "Leave"}
                  </button>
                ) : (
                  <button
                    className="removeMemberBtn modalActionBtn"
                    onClick={() =>
                      handleRemoveMember(
                        member.membership_id,
                        member.name || member.email
                      )
                    }
                    disabled={removingId === member.membership_id}
                  >
                    {removingId === member.membership_id ? "Removing..." : "Remove"}
                  </button>
                )}
              </li>
            ))}
          </ul>
          <button className="closeModalBtn" onClick={closeMembersModal}>
            Close
          </button>
        </div>
      </dialog>

      <div className="messages" ref={messagesRef} onScroll={handleMessagesScroll}>
        {hasMore && (
          <button
            className="smallBtn loadOlderBtn"
            onClick={loadOlderMessages}
            disabled={loadingOlder}
          >
            {loadingOlder ? "Loading..." : "Load earlier messages"}
          </button>
        )}
        {messageList}
        <div ref={messagesEndRef} />
      </div>

      <div className="messageInputArea" onKeyDown={handleKeyDown}>
        <ReactQuill value={message} onChange={handleMessageChange} />
        <div className="messageInputFooter">
          <span className="sendHint">Ctrl+Enter to send</span>
          <button
            className="sendBtn"
            onClick={sendMessage}
            disabled={!canSend}
          >
            Send
          </button>
        </div>
      </div>
    </div>
  );
}
