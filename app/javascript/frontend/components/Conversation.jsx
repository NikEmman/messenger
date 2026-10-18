import React, { useState, useRef, useEffect, useLayoutEffect } from "react";
import "../styles/Conversation.css";
import { Link } from "react-router-dom";
import { api } from "../api";
import Spinner from "./Spinner";
import MessageEditor from "./MessageEditor";
import { onInboxEvent, sendTyping } from "../cable";

const GROUP_WINDOW_MS = 5 * 60 * 1000;

function formatTime(timestamp) {
  return new Date(timestamp).toLocaleTimeString(undefined, { hour: "numeric", minute: "2-digit" });
}

function dayLabel(timestamp) {
  const date = new Date(timestamp);
  const today = new Date();
  const yesterday = new Date();
  yesterday.setDate(today.getDate() - 1);
  if (date.toDateString() === today.toDateString()) return "Today";
  if (date.toDateString() === yesterday.toDateString()) return "Yesterday";
  return date.toLocaleDateString(undefined, {
    weekday: "short",
    month: "short",
    day: "numeric",
    year: date.getFullYear() === today.getFullYear() ? undefined : "numeric",
  });
}

const isSameDay = (a, b) =>
  new Date(a.created_at).toDateString() === new Date(b.created_at).toDateString();

// Consecutive messages from one sender, close together, render as one group.
function isSameGroup(a, b) {
  return (
    Boolean(a && b) &&
    a.user_id === b.user_id &&
    isSameDay(a, b) &&
    Math.abs(new Date(b.created_at) - new Date(a.created_at)) < GROUP_WINDOW_MS
  );
}

const TYPING_THROTTLE_MS = 2000;
const TYPING_TIMEOUT_MS = 4000;

// Add a server message, replacing the optimistic copy it confirms (matched by
// client_id) and ignoring duplicates (the POST response and broadcast race).
function mergeMessage(messages, message) {
  if (message.client_id && messages.some((m) => m.client_id === message.client_id)) {
    return messages.map((m) => (m.client_id === message.client_id ? message : m));
  }
  return messages.some((m) => m.id === message.id) ? messages : [...messages, message];
}

const newClientId = () => `tmp-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;

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
  onlineUserIds = new Set(),
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
  // { userId: timeoutId } for members currently typing
  const [typingUsers, setTypingUsers] = useState({});
  const lastTypingSent = useRef(0);

  const stopTyping = (userId) =>
    setTypingUsers((prev) => {
      if (!(userId in prev)) return prev;
      clearTimeout(prev[userId]);
      const { [userId]: _, ...rest } = prev;
      return rest;
    });

  // Live messages and typing indicators for this conversation
  useEffect(() => {
    setTypingUsers({});
    return onInboxEvent((event) => {
      if (event.type === "message" && event.message.conversation_id === conversation.id) {
        stopTyping(event.message.user_id);
        setMessages((prev) => mergeMessage(prev, event.message));
      } else if (event.type === "typing" && event.conversation_id === conversation.id) {
        setTypingUsers((prev) => {
          clearTimeout(prev[event.user_id]);
          const timeout = setTimeout(() => stopTyping(event.user_id), TYPING_TIMEOUT_MS);
          return { ...prev, [event.user_id]: timeout };
        });
      }
    });
  }, [conversation.id]);

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
      .catch(() => !cancelled && handleNotificationChange("Failed to load messages", "error"))
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
      .catch(() => handleNotificationChange("Failed to load older messages", "error"))
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
        .catch(() => handleNotificationChange("Failed to load users", "error"));
    }, 250);
    return () => clearTimeout(timer);
  }, [searchText, showUserList]);

  const messageList =
    messages.length > 0 ? (
      messages.map((msg, i) => {
        const prev = messages[i - 1];
        const next = messages[i + 1];
        const isOwn = msg.user_id === user.id;
        const member = conversation.members.find((m) => m.id === msg.user_id);
        const startsDay = !prev || !isSameDay(prev, msg);
        const startsGroup = !isSameGroup(prev, msg);
        const endsGroup = !isSameGroup(msg, next);
        const className = [
          "messageContainer",
          isOwn ? "myMessage" : "message",
          startsGroup && "groupStart",
          endsGroup && "groupEnd",
        ]
          .filter(Boolean)
          .join(" ");

        return (
          <React.Fragment key={msg.client_id || msg.id}>
            {startsDay && (
              <div className="daySeparator" role="separator">
                <span>{dayLabel(msg.created_at)}</span>
              </div>
            )}
            <div className={className}>
              {endsGroup ? (
                <Link to={`/profile/${msg.user_id}`} className="messageAvatar">
                  <img src={member?.avatar_url} alt={member?.name || "Avatar"} />
                </Link>
              ) : (
                <span className="messageAvatar" aria-hidden="true" />
              )}
              <div className="messageBubbleWrapper">
                {startsGroup && !isOwn && (
                  <span className="messageSender">{member?.name || "Former member"}</span>
                )}
                <div
                  className={`messageBubble${msg.status ? ` ${msg.status}` : ""}`}
                  dangerouslySetInnerHTML={{ __html: msg.body }}
                />
                {msg.status === "failed" ? (
                  <span className="messageFailed">
                    Not sent ·{" "}
                    <button className="linkBtn" onClick={() => retryMessage(msg)}>
                      Retry
                    </button>{" "}
                    ·{" "}
                    <button className="linkBtn" onClick={() => discardMessage(msg)}>
                      Remove
                    </button>
                  </span>
                ) : msg.status === "pending" ? (
                  <span className="messageTime">Sending…</span>
                ) : endsGroup && (
                  <time
                    className="messageTime"
                    dateTime={msg.created_at}
                    title={new Date(msg.created_at).toLocaleString()}
                  >
                    {formatTime(msg.created_at)}
                  </time>
                )}
              </div>
            </div>
          </React.Fragment>
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
    const now = Date.now();
    if (!isEditorEmpty(content) && now - lastTypingSent.current > TYPING_THROTTLE_MS) {
      lastTypingSent.current = now;
      sendTyping(conversation.id);
    }
  };

  const typingNames = Object.keys(typingUsers)
    .map((id) => conversation.members.find((m) => String(m.id) === id))
    .filter(Boolean)
    .map((m) => m.name || m.email);
  const typingText =
    typingNames.length === 0
      ? ""
      : typingNames.length === 1
        ? `${typingNames[0]} is typing…`
        : `${typingNames.join(", ")} are typing…`;

  const presenceDot = (member) =>
    onlineUserIds.has(member.id) && (
      <span className="presenceDot" title="Online" aria-label="online" />
    );

  const participants = conversation.members.map((member) => (
    <span key={member.id}>
      {presenceDot(member)}
      {member.name || member.email}
    </span>
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

  const setMessageStatus = (clientId, status) =>
    setMessages((prev) => prev.map((m) => (m.client_id === clientId ? { ...m, status } : m)));

  const deliver = (pending) => {
    api
      .post(`/api/conversations/${conversation.id}/messages`, {
        message: { body: pending.body, client_id: pending.client_id },
      })
      .then((data) => {
        setMessages((prev) => mergeMessage(prev, data.message));
        handleMessageSent(data.message);
      })
      .catch(() => {
        setMessageStatus(pending.client_id, "failed");
        handleNotificationChange("Failed to send message", "error");
      });
  };

  // Show the message immediately; the server's copy replaces it on success.
  const sendMessage = (html = message) => {
    if (isEditorEmpty(html)) return;
    const pending = {
      id: null,
      client_id: newClientId(),
      body: html,
      user_id: user.id,
      conversation_id: conversation.id,
      created_at: new Date().toISOString(),
      status: "pending",
    };
    stickToBottom.current = true;
    setMessages((prev) => [...prev, pending]);
    setMessage("");
    deliver(pending);
  };

  const retryMessage = (msg) => {
    setMessageStatus(msg.client_id, "pending");
    deliver(msg);
  };

  const discardMessage = (msg) =>
    setMessages((prev) => prev.filter((m) => m.client_id !== msg.client_id));

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
      .catch(() => handleNotificationChange("Failed to add member", "error"));
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
      .catch(() => handleNotificationChange("Failed to remove member", "error"))
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
      .catch(() => handleNotificationChange("Failed to leave conversation", "error"))
      .finally(() => setRemovingId(null));
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
                    {presenceDot(member)}
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

      <p className="typingIndicator" aria-live="polite">
        {typingText}
      </p>

      <div className="messageInputArea">
        <MessageEditor
          value={message}
          onChange={handleMessageChange}
          onSubmit={sendMessage}
          placeholder={`Message ${conversation.topic}`}
        />
        <div className="messageInputFooter">
          <span className="sendHint">Enter to send · Shift+Enter for a new line</span>
          <button
            className="sendBtn"
            onClick={() => sendMessage()}
            disabled={!canSend}
          >
            Send
          </button>
        </div>
      </div>
    </div>
  );
}
