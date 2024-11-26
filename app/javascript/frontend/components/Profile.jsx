import React, { useState } from "react";

export default function Profile() {
  const [user, setUser] = useState(false);

  return (
    <>
      <h1>Profile Page</h1>
      {user && user.profile ? (
        <p>Welcome {user.profile.name}</p>
      ) : (
        <p>Create a profile first</p>
      )}
    </>
  );
}
