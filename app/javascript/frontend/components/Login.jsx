import React, { useState } from "react";
import { Link } from "react-router-dom";
export default function Login() {
  const [password, setPassword] = useState(null);
  const [email, setEmail] = useState(null);

  const handleEmailChange = (e) => {
    let email = e.target.value;
    setEmail(email);
  };
  const handlePasswordChange = (e) => {
    let pass = e.target.value;
    setPassword(pass);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    const url = "/api/placeholder/new";
    try {
      let res = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(email, password),
      });
      if (res.ok) {
        // re-direct to home
        // set authenticated to true
      } else {
        console.error("Failed to submit:", res.statusText);
      }
    } catch (error) {
      console.error("Error submitting form:", error);
    }
  };

  return (
    <>
      <h1>Sign in</h1>
      <form action="/" method="post">
        <label htmlFor="email">Email: </label>
        <input
          type="email"
          name="email"
          id="email"
          onChange={handleEmailChange}
        />
        <label htmlFor="password">Password: </label>
        <input
          type="password"
          name="password"
          id="password"
          onChange={handlePasswordChange}
        />
        <button type="submit" onSubmit={handleSubmit}>
          Sign In
        </button>
      </form>
      <Link to="/signup">Create new account</Link>
    </>
  );
}
