import React from "react";

export default function SignUp() {
  return (
    <>
      <form action="/" method="post">
        <label htmlFor="email">Email: </label>
        <input type="email" name="email" id="email" />
        <label htmlFor="password">Password: </label>
        <input type="password" name="password" id="password" />
        <label htmlFor="password2">Confirm password: </label>
        <input type="password" name="password2" id="password2" />
        <button type="submit">Sign Up</button>
      </form>
    </>
  );
}
