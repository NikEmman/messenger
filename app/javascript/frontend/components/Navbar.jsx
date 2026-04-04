import React, { useContext, useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { AppContext } from "./AppContext";
import "../styles/Navbar.css";

export default function Navbar() {
  const { user, loggedInStatus, handleSuccessfulLogOut, url } =
    useContext(AppContext);
  const navigate = useNavigate();

  const [darkMode, setDarkMode] = useState(() => {
    return localStorage.getItem("theme") === "dark";
  });

  useEffect(() => {
    if (darkMode) {
      document.documentElement.setAttribute("data-theme", "dark");
      localStorage.setItem("theme", "dark");
    } else {
      document.documentElement.removeAttribute("data-theme");
      localStorage.setItem("theme", "light");
    }
  }, [darkMode]);

  const handleLogOut = () => {
    fetch(`${url}/api/logout`, {
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
      <Link to="/messages">Messenger</Link>
      <Link to={`/profile/${user.id}`}>Profile</Link>

      <button
        className="themeToggle"
        onClick={() => setDarkMode((d) => !d)}
        title={darkMode ? "Switch to light mode" : "Switch to dark mode"}
        aria-label="Toggle dark mode"
      >
        {darkMode ? "☀" : "☾"}
      </button>

      {loggedInStatus === "LOGGED_IN" && (
        <button onClick={handleLogOut}>Logout</button>
      )}
    </nav>
  );
}
