import React, { useState } from "react";
import { Link } from "react-router-dom";
export default function Login() {
  const [password, setPassword] = useState("");
  const [email, setEmail] = useState("");
  const [passwordConfirmation, setPasswordConfirmation] = useState("");
  const [registrationErrors, setRegistrationErrors] = useState("");

  const handleSubmit = (e) => {
    e.preventDefault();
    console.log("form submitted");
  };

  const handleEmailChange = (e) => {
    setEmail(e.target.value);
  };
  const handlePasswordChange = (e) => {
    setPassword(e.target.value);
  };
  const handlePasswordConfirmationChange = (e) => {
    setPasswordConfirmation(e.target.value);
  };
  return (
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
        <label htmlFor="password_confirmation">
          <input
            type="password"
            name="password_confirmation"
            id="password_confirmation"
            placeholder="Confirm Password"
            value={passwordConfirmation}
            onChange={handlePasswordConfirmationChange}
            required
          />
        </label>

        <button type="submit">Sign In</button>
      </form>
      <Link to="/signup">Create new account</Link>
    </>
  );
}
