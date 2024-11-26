import React from "react";

export default function Navbar() {
  return (
    <>
      <ul>
        <li>
          <a href="/profile">Profile</a>
        </li>
        <li>
          <a href="/logout">Logout</a>
        </li>
        <li>
          <a href="/login">Login</a>
        </li>
      </ul>
    </>
  );
}
