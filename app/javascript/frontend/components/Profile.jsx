import React, { useContext, useEffect } from "react";
import { Navigate } from "react-router-dom";
import { AppContext } from "./AppContext";

export default function Profile() {
  const { user, loggedInStatus } = useContext(AppContext);

  if (loggedInStatus === "NOT_LOGGED_IN") {
    return <Navigate to="/" replace />;
  }

  return (
    <>
      <h1>Profile Page</h1>
      {user && user.name ? (
        <p>Welcome {user.name}</p>
      ) : (
        <p>Create a profile first</p>
      )}
    </>
  );
}
