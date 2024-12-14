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
    fetch(`http://localhost/profiles/:${user.id}`)
      .then((response) => response.json())
      .then((data) => {
        if (data.status === "not_found") setProfile({});
        else setProfile({ data });
      });
  }, []);

  const handleUpdateProfile = (data) => {
    // the fetch maybe should be in profileform component
    // fetch(`http://localhost:3000/profiles/${profile.id}`, {
    //   method: "PUT",
    //   headers: { "Content-Type": "application/json" },
    //   body: JSON.stringify({ profile: newProfile }),
    //   credentials: "include",
    //   mode: "cors",
    // });
    setProfile(data);
    setShowForm(false);
  };
  const handleCreateProfile = (data) => {
    setProfile(data);
  };

  return (
    <>
      <h1>Profile Page</h1>
      {Object.keys(profile).length !== 0 ? (
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
