import React from "react";

export default function Login() {
  return (
    <>
      <h1>Sign in</h1>
      <form action="/" method="post">
        <label htmlFor="email">Email: </label>
        <input type="email" name="email" id="email" />
        <label htmlFor="password">Password: </label>
        <input type="password" name="password" id="password" />
        <button type="submit">Sign In</button>
      </form>
      <a href="/signup">Create new account</a>
    </>
  );
}
