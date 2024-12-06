import React, { useState, useContext, useEffect } from "react";
import { Navigate } from "react-router-dom";
import { AppContext } from "./AppContext";
import ProfileForm from "./ProfileForm";

export default function Profile() {
  const [profile, setProfile] = useState({});
  const [showForm, setShowForm] = useState(false);
  const { user, loggedInStatus } = useContext(AppContext);

  if (loggedInStatus === "NOT_LOGGED_IN") {
    return <Navigate to="/" replace />;
  }

  //get the user's profile
  useEffect(() => {
    fetch(`http://localhost/profile/:${user.id}`)
      .then((response) => response.json())
      .then((data) => setProfile(data));
  }, [user]);

  const handleUpdateProfile = (data) => {
    //fetch with method update
    setProfile(data);
    setShowForm(false);
  };
  const handleCreateProfile = (data) => {
    setProfile(data);
  };

  return (
    <>
      <h1>Profile Page</h1>
      {Object.keys(profile).length === 0 ? (
        showForm ? (
          <ProfileForm
            profile={profile}
            onSubmit={handleUpdateProfile}
            submitText={"Update"}
          />
        ) : (
          <>
            <p>{user.name}'s Profile </p>
            <p>{profile.hobby}</p>
            <p>{profile.address}</p>
            <p>{profile.work}</p>
            <button onClick={() => setShowForm(true)}>Edit profile</button>
          </>
        )
      ) : (
        <>
          <h2>Create a profile first</h2>
          <ProfileForm
            profile={profile}
            onSubmit={handleCreateProfile}
            submitText={"Create"}
          />
        </>
      )}
    </>
  );
}
