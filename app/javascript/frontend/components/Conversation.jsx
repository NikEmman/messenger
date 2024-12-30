import React, { useState } from "react";
import ReactQuill from "react-quill";
import { Link } from "react-router-dom";
import "react-quill/dist/quill.snow.css";

export default function Conversation({
  handleNotificationChange,
  conversation,
  user,
  handleMessageSent,
  handleMemberAdded,
}) {
  const [message, setMessage] = useState("");
  const [showUserList, setShowUserList] = useState(false);
  const [searchText, setSearchText] = useState("");
  const [selection, setSelection] = useState(null);
  const [userList, setUserList] = useState([]);

  const messages =
    conversation.messages.length > 0 ? (
      conversation.messages.map((msg) => {
        const className = msg.user_id === user.id ? "myMessage" : "message";

        const member = conversation.members.find(
          (member) => member.id === msg.user_id
        );

        return (
          <div
            key={msg.id || msg.body}
            className={"messageContainer " + className}
          >
            <Link to={`/profile/${msg.user_id}`}>
              <img src={member && member.avatar_url} alt="Avatar" />
            </Link>
            <p dangerouslySetInnerHTML={{ __html: msg.body }}></p>
          </div>
        );
      })
    ) : (
      <h2>No messages in this conversation</h2>
    );

  const handleMessageChange = (content) => {
    handleNotificationChange("");
    setMessage(content);
  };
  const participants = conversation.members.map((member, index) => {
    return (
      <span key={member.id}>
        {member.name || member.email}
        {index < conversation.members.length - 1 && " | "}
      </span>
    );
  });

  const onAddUserClick = () => {
    handleNotificationChange("");
    setShowUserList(true);
    fetch("http://localhost:3000/api/other_users")
      .then((response) => response.json())
      .then((data) => {
        if (data.status === "ok") {
          setUserList(data.users);
        }
      });
  };

  const sendMessage = () => {
    const newMessage = {
      user_id: user.id,
      body: message,
      conversation_id: conversation.id,
    };

    fetch("http://localhost:3000/api/messages", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ message: newMessage }),
      credentials: "include",
      mode: "cors",
    })
      .then((response) => response.json())
      .then((data) => {
        if (data.status === "created") {
          handleNotificationChange("Message successfully sent.");
          handleMessageSent(data.message);
        }
      })
      .catch(() => handleNotificationChange("Failed to send message"));

    setMessage("");
  };

  const onSearchChange = (e) => {
    setSearchText(e.target.value);
  };
  const onCancelClick = () => {
    setSelection(null);
    setShowUserList(false);
  };

  const filteredUsers = userList
    .filter((user) => {
      return (
        user.email?.includes(searchText) &&
        !conversation.members.some((member) => member.email === user.email)
      );
    })
    .map((user) => (
      <option key={user.id} value={user.id}>
        {user.name || user.email}
      </option>
    ));

  const handleAddUser = () => {
    const memberData = { conversation_id: conversation.id, user_id: selection };
    fetch("http://localhost:3000/api/conversation_users", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(memberData),
      credentials: "include",
      mode: "cors",
    })
      .then((response) => response.json())
      .then((data) => {
        if (data.status === "created") {
          handleNotificationChange("Added member");
          setUserList(userList.filter((user) => user.id !== selection));
          const addedUser = userList.find((user) => user.id == selection);
          handleMemberAdded(addedUser);
          setShowUserList(false);
        }
      })
      .catch((error) => console.error("Error adding member:", error));
  };

  const userSelection = userList ? (
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
  ) : (
    <p>Loading users...</p>
  );

  return (
    <div className="conversation">
      <div className="conversationHeader">
        <p className="topic">{conversation.topic}</p>
        <p className="members">{participants}</p>
        {showUserList ? (
          userSelection
        ) : (
          <button className="smallBtn" onClick={onAddUserClick}>
            Add user
          </button>
        )}
      </div>
      <div className="messages">{messages}</div>
      <button onClick={sendMessage}>Send</button>
      <ReactQuill value={message} onChange={handleMessageChange} />
    </div>
  );
}
