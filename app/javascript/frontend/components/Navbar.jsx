import React, { useContext } from "react";
import { Link, useNavigate } from "react-router-dom";
import { AppContext } from "./AppContext";
export default function Navbar() {
  const { user, loggedInStatus, handleSuccessfulLogOut } =
    useContext(AppContext);
  let navigate = useNavigate();

  const handleLogOut = () => {
    fetch("http://localhost:3000/api/logout", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      mode: "cors",
    })
      .then((response) => response.json())
      .then((data) => {
        if (data.logged_out) {
          handleSuccessfulLogOut();
          navigate("/");
        }
      });
  };
  return (
    <nav>
      <Link to="/messages">Messages</Link>
      <Link to={`/profile/${user.id}`}>Profile</Link>

      {loggedInStatus === "LOGGED_IN" && (
        <button onClick={handleLogOut}>Logout</button>
      )}
    </nav>
  );
}
