import React, { useState } from "react";
import ReactQuill from "react-quill";
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

  const messages = conversation.messages.map((msg) => {
    const className = msg.user_id === user.id ? "myMessage" : "message";
    return (
      <p
        key={msg.id}
        className={className}
        dangerouslySetInnerHTML={{ __html: msg.body }}
      ></p>
    );
  });

  const handleChange = (content) => {
    handleNotificationChange("");
    setMessage(content);
  };

  const onAddUserClick = () => {
    handleNotificationChange("");
    setShowUserList(true);
    fetch("http://localhost:3000/other_users")
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

    fetch("http://localhost:3000/messages", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(newMessage),
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
    fetch("http://localhost:3000/conversation_users", {
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
    <>
      <input
        placeholder="Search users"
        onChange={onSearchChange}
        value={searchText}
      />
      <select
        name="users"
        id="users"
        onChange={(e) => setSelection(e.target.value)}
      >
        <option value="">Select a user</option>
        {filteredUsers}
      </select>
      {selection && <button onClick={handleAddUser}>Add</button>}
      <button onCLick={onCancelClick}>Cancel</button>
    </>
  ) : (
    <p>Loading users...</p>
  );

  return (
    <div className="conversation">
      <div className="conversationHeader">
        <p className="topic">{conversation.topic}</p>
        {showUserList ? (
          userSelection
        ) : (
          <button onClick={onAddUserClick}>Add user</button>
        )}
      </div>
      <div className="messages">{messages}</div>
      <ReactQuill value={message} onChange={handleChange} />
      <button onClick={sendMessage}>Send</button>
    </div>
  );
}
