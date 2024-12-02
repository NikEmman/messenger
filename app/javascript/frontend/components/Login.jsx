import React, { useContext, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { AppContext } from "./AppContext";
export default function Login() {
  const [password, setPassword] = useState("");
  const [email, setEmail] = useState("");
  const { handleSuccessfulAuth, loggedInStatus } = useContext(AppContext);
  const navigate = useNavigate();
  const messagesRouter = () => navigate("/messages");

  const handleSubmit = (e) => {
    e.preventDefault();

    const data = {
      user: {
        email: email,
        password: password,
      },
    };
    fetch("http://localhost:3000/sessions", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
      credentials: "include",
      mode: "cors",
    })
      .then((response) => response.json())
      .then((data) => {
        if (data.status === "created") {
          //not working
          handleSuccessfulAuth(data.user);
          messagesRouter();
        }
      })
      .catch((error) => {
        console.log("Login error: ", error);
      });
  };

  const handleEmailChange = (e) => {
    setEmail(e.target.value);
  };
  const handlePasswordChange = (e) => {
    setPassword(e.target.value);
  };

  return loggedInStatus === "LOGGED_IN" ? (
    <>
      <h1>You are already logged in</h1>
      <Link to="/messages">Messages</Link>
    </>
  ) : (
    <>
      <h1>Sign in</h1>
      <form action="/" method="post" onSubmit={handleSubmit}>
        <label htmlFor="email">
          <input
            type="email"
            name="email"
            id="email"
            onChange={handleEmailChange}
            value={email}
            placeholder="Email"
            required
          />
        </label>

        <label htmlFor="password">
          <input
            type="password"
            name="password"
            id="password"
            onChange={handlePasswordChange}
            value={password}
            placeholder="Password"
            required
          />
        </label>

        <button type="submit">Sign In</button>
      </form>
      <Link to="/signup">Create new account</Link>
    </>
  );
}
