import React, { useState, useContext, useEffect } from "react";
import { Navigate, useParams } from "react-router-dom";
import { AppContext } from "./AppContext";
import ProfileForm from "./ProfileForm";

export default function Profile() {
  const { id } = useParams();
  const [profile, setProfile] = useState({});
  const [showForm, setShowForm] = useState(false);
  const { user, loggedInStatus } = useContext(AppContext);

  if (loggedInStatus === "NOT_LOGGED_IN") {
    return <Navigate to="/" replace />;
  }
  // const isCurrentUser = user.id === id;
  useEffect(() => {
    fetch(`http://localhost:3000/api/profiles/${id}`)
      .then((response) => response.json())
      .then((data) => {
        if (data.status === "not_found") setProfile({});
        else setProfile(data);
      });
  }, [id]);

  const handleCreateProfile = (data) => {
    const formData = new FormData();

    formData.append("profile[user_id]", user.id);
    formData.append("profile[address]", data.address);
    formData.append("profile[birthday]", data.birthday);

    if (data.avatar) {
      formData.append("profile[avatar]", data.avatar);
    }

    fetch("http://localhost:3000/api/profiles/", {
      method: "POST",
      body: formData,
      credentials: "include",
      mode: "cors",
    })
      .then((response) => response.json())
      .then((data) => {
        setProfile(data.profile);
        setShowForm(false);
      })
      .catch((error) => console.error("Unable to create: ", error));
  };
  const handleUpdateProfile = (data) => {
    const formData = new FormData();

    formData.append("profile[address]", data.address);
    formData.append("profile[birthday]", data.birthday);

    if (data.avatar) {
      formData.append("profile[avatar]", data.avatar);
    }

    fetch(`http://localhost:3000/api/profiles/${profile.id}`, {
      method: "PUT",
      body: formData,
      credentials: "include",
      mode: "cors",
    })
      .then((response) => response.json())
      .then((data) => {
        setProfile(data.profile);
        setShowForm(false);
      })
      .catch((error) => console.error("Unable to update: ", error));
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
            <img src={profile.avatar_url} alt="Avatar" />
            <p>{profile.name}'s Profile </p>
            <p>{profile.address}</p>
            <p>{profile.birthday}</p>
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
