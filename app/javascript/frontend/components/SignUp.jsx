import React, { useState } from "react";

export default function SignUp() {
  const [password, setPassword] = useState(null);
  const [password2, setPassword2] = useState(null);
  const [email, setEmail] = useState(null);

  const handleEmailChange = (e) => {
    let email = e.target.value;
    setEmail(email);
  };
  const handlePasswordChange = (e) => {
    let pass = e.target.value;
    setPassword(pass);
  };
  const handlePassword2Change = (e) => {
    let pass = e.target.value;
    setPassword2(pass);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    const url = "/api/placeholder/new";
    try {
      let res = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(email, password, password2),
      });
      if (res.ok) {
        // re-direct to new profile page
        // set authenticated to true?
      } else {
        console.error("Failed to submit:", res.statusText);
      }
    } catch (error) {
      console.error("Error submitting form:", error);
    }
  };

  return (
    <>
      <form action="/" method="post">
        <label htmlFor="email">
          <input
            type="email"
            name="email"
            id="email"
            placeholder="Email"
            onChange={handleEmailChange}
          />
        </label>

        <label htmlFor="password">
          <input
            type="password"
            name="password"
            id="password"
            placeholder="Password"
            onChange={handlePasswordChange}
          />
        </label>

        <label htmlFor="password2">
          <input
            type="password"
            name="password_confirm"
            id="password2"
            placeholder="Confirm Password"
            onChange={handlePassword2Change}
          />
        </label>

        <button type="submit" onSubmit={handleSubmit}>
          Sign Up
        </button>
      </form>
    </>
  );
}
