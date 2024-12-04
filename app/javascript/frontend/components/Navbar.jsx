import React, { useContext } from "react";
import { Link, Navigate } from "react-router-dom";
import { AppContext } from "./AppContext";
export default function Navbar() {
  const { loggedInStatus, handleSuccessfulLogOut } = useContext(AppContext);

  const handleLogOut = () => {
    fetch("http://localhost:3000/logout", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      mode: "cors",
    })
      .then((response) => response.json())
      .then((data) => {
        if (data.logged_out) {
          handleSuccessfulLogOut();
        }
      });
  };
  return (
    <nav>
      <Link to="/messages">Messages</Link>
      <Link to="/profile">Profile</Link>

      {loggedInStatus === "LOGGED_IN" && (
        <button onClick={handleLogOut}>Logout</button>
      )}
    </nav>
  );
}
