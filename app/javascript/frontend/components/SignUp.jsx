import React, { useState, useContext } from "react";
import { AppContext } from "./AppContext";
import { useNavigate } from "react-router-dom";

export default function SignUp() {
  const [password, setPassword] = useState("");
  const [email, setEmail] = useState("");
  const [name, setName] = useState("");

  const [passwordConfirmation, setPasswordConfirmation] = useState("");
  const [registrationErrors, setRegistrationErrors] = useState("");
  const { handleSuccessfulAuth } = useContext(AppContext);
  const navigate = useNavigate();
  const messagesRouter = () => navigate("/messages");

  const handleSubmit = (e) => {
    e.preventDefault();

    const data = {
      user: {
        email: email,
        name: name,
        password: password,
        password_confirmation: passwordConfirmation,
      },
    };
    fetch("http://localhost:3000/registrations", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
      credentials: "include",
      mode: "cors",
    })
      .then((response) => response.json())
      .then((data) => {
        if (data.status === "created") {
          handleSuccessfulAuth(data.user);
          messagesRouter();
        }
      })
      .catch((error) => {
        setRegistrationErrors(error);
      });
  };

  const handleEmailChange = (e) => {
    setEmail(e.target.value);
  };
  const handleNameChange = (e) => {
    setName(e.target.value);
  };
  const handlePasswordChange = (e) => {
    setPassword(e.target.value);
  };
  const handlePasswordConfirmationChange = (e) => {
    setPasswordConfirmation(e.target.value);
  };
  return (
    <>
      <h1>Sign up</h1>
      {registrationErrors && <p className="error">{registrationErrors}</p>}
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
        <label htmlFor="name">
          <input
            type="name"
            name="name"
            id="name"
            onChange={handleNameChange}
            value={name}
            placeholder="Name"
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
    </>
  );
}
