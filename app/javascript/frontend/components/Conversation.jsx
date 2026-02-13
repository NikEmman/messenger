import React, { useState, useContext, useRef } from "react";
import "../styles/Conversation.css";
import ReactQuill from "react-quill";
import { Link } from "react-router-dom";
import "react-quill/dist/quill.snow.css";
import { AppContext } from "./AppContext";

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
  const [showMembersModal, setShowMembersModal] = useState(false);
  const [searchText, setSearchText] = useState("");
  const [selection, setSelection] = useState(null);
  const [userList, setUserList] = useState([]);
  const [removingId, setRemovingId] = useState(null);
  const dialogRef = useRef(null);
  const { url } = useContext(AppContext);

  const messages =
    conversation.messages.length > 0 ? (
      conversation.messages.map((msg) => {
        const className = msg.user_id === user.id ? "myMessage" : "message";

        const member = conversation.members.find(
          (member) => member.id === msg.user_id,
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

  const participants = conversation.members.map((member) => (
    <span key={member.id}>{member.name || member.email}</span>
  ));

  const onAddUserClick = () => {
    handleNotificationChange("");
    setShowUserList(true);
    fetch(`${url}/api/other_users`)
      .then((response) => response.json())
      .then((data) => {
        if (data.status === "ok") {
          setUserList(data.users);
        }
      });
  };

  const openMembersModal = () => {
    setShowMembersModal(true);
    dialogRef.current?.showModal();
  };

  const closeMembersModal = () => {
    setShowMembersModal(false);
    dialogRef.current?.close();
  };

  const sendMessage = () => {
    const newMessage = {
      user_id: user.id,
      body: message,
      conversation_id: conversation.id,
    };

    fetch(`${url}/api/messages`, {
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
    .filter((u) => {
      return (
        u.email?.includes(searchText) &&
        !conversation.members.some((member) => member.email === u.email)
      );
    })
    .map((u) => (
      <option key={u.id} value={u.id}>
        {u.name || u.email}
      </option>
    ));

  const handleAddUser = () => {
    const memberData = { conversation_id: conversation.id, user_id: selection };
    fetch(`${url}/api/conversation_users`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(memberData),
      credentials: "include",
      mode: "cors",
    })
      .then((response) => {
        console.log(response);
        return response.json();
      })
      .then((data) => {
        if (data.status === "created") {
          handleNotificationChange("Added member");
          handleMemberAdded(data.member);
          setUserList(userList.filter((u) => u.id !== selection));
          setShowUserList(false);
        }
      })
      .catch((error) => console.error("Error adding member:", error));
  };

  const handleRemoveMember = (membershipId, memberName) => {
    if (!window.confirm(`Remove ${memberName} from this conversation?`)) {
      return;
    }

    setRemovingId(membershipId);

    fetch(`${url}/api/conversation_users/${membershipId}`, {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      mode: "cors",
    })
      .then((response) => response.json())
      .then((data) => {
        if (data.conversation_deleted) {
          handleNotificationChange(
            "Conversation deleted (no members remaining)",
          );
          handleConversationDeleted(conversation.id);
          closeMembersModal();
        } else {
          handleNotificationChange("Member removed");
          handleMemberRemoved(data.removed_user_id);
        }
      })
      .catch((error) => {
        console.error("Error removing member:", error);
        handleNotificationChange("Failed to remove member");
      })
      .finally(() => {
        setRemovingId(null);
      });
  };

  const handleLeaveConversation = () => {
    if (!window.confirm("Leave this conversation?")) {
      return;
    }

    const currentUserMembership = conversation.members.find(
      (member) => member.id === user.id,
    );

    if (!currentUserMembership) return;

    setRemovingId(currentUserMembership.membership_id);

    fetch(
      `${url}/api/conversation_users/${currentUserMembership.membership_id}`,
      {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        mode: "cors",
      },
    )
      .then((response) => response.json())
      .then((data) => {
        if (data.conversation_deleted) {
          handleNotificationChange(
            "You left the conversation (conversation deleted)",
          );
          handleConversationDeleted(conversation.id);
        } else {
          handleNotificationChange("You left the conversation");
          handleConversationDeleted(conversation.id);
        }
        closeMembersModal();
      })
      .catch((error) => {
        console.error("Error leaving conversation:", error);
        handleNotificationChange("Failed to leave conversation");
      })
      .finally(() => {
        setRemovingId(null);
      });
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
                    {removingId === member.membership_id
                      ? "Leaving..."
                      : "Leave"}
                  </button>
                ) : (
                  <button
                    className="removeMemberBtn modalActionBtn"
                    onClick={() =>
                      handleRemoveMember(
                        member.membership_id,
                        member.name || member.email,
                      )
                    }
                    disabled={removingId === member.membership_id}
                  >
                    {removingId === member.membership_id
                      ? "Removing..."
                      : "Remove"}
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

      <div className="messages">{messages}</div>
      <button onClick={sendMessage}>Send</button>
      <ReactQuill value={message} onChange={handleMessageChange} />
    </div>
  );
}
