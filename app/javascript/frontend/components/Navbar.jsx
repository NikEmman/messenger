import React, { useContext } from "react";
import { Link, useNavigate } from "react-router-dom";
import { AppContext } from "./AppContext";
export default function Navbar() {
  const { loggedInStatus, handleSuccessfulLogOut } = useContext(AppContext);
  const navigate = useNavigate();
  const signInRouter = navigate("/");

  const handleLogOut = () => {
    if (loggedInStatus === "LOGGED_IN") {
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
    } else {
      signInRouter();
    }
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
