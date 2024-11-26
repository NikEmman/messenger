import React from "react";
import { Link } from "react-router-dom";
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
      <Link to="/signup">Create new account</Link>
    </>
  );
}
