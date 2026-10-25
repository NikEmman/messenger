import React, { useState, useContext, useEffect } from "react";
import "../styles/Profile.css";
import { Navigate, useParams } from "react-router-dom";
import { AppContext } from "./AppContext";
import ProfileForm from "./ProfileForm";
import DeleteAccount from "./DeleteAccount";
import Spinner from "./Spinner";
import { api } from "../api";

export default function Profile() {
  const { id } = useParams();
  const [profile, setProfile] = useState({});
  const [profileLoading, setProfileLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const { user, loggedInStatus } = useContext(AppContext);

  if (loggedInStatus === "NOT_LOGGED_IN") {
    return <Navigate to="/" replace />;
  }

  const isCurrentUser = user.id === parseInt(id);

  useEffect(() => {
    setProfileLoading(true);
    api
      .get(`/api/profiles/${id}`)
      .then((data) => setProfile(data))
      .catch((error) => {
        setProfile({});
        if (error.status !== 404) console.error("Unable to load profile: ", error);
      })
      .finally(() => setProfileLoading(false));
  }, [id]);

  const handleCreateProfile = (data) => {
    const formData = new FormData();

    formData.append("profile[address]", data.address);
    formData.append("profile[birthday]", data.birthday);

    if (data.avatar) {
      formData.append("profile[avatar]", data.avatar);
    }

    api
      .postForm("/api/profiles", formData)
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

    api
      .putForm(`/api/profiles/${profile.id}`, formData)
      .then((data) => {
        setProfile(data.profile);
        setShowForm(false);
      })
      .catch((error) => console.error("Unable to update: ", error));
  };

  if (profileLoading) {
    return (
      <div className="formPage">
        <Spinner label="Loading profile..." />
      </div>
    );
  }

  if (Object.keys(profile).length === 0) {
    return (
      <>
        {isCurrentUser ? (
          <div className="formPage">
            <h1>Create a profile first</h1>
            <ProfileForm
              profile={profile}
              onSubmit={handleCreateProfile}
              submitText={"Create"}
            />
            <DeleteAccount />
          </div>
        ) : (
          <h2>This user has not created a profile yet</h2>
        )}
      </>
    );
  }

  if (showForm) {
    return (
      <div className="formPage">
        <h1>Profile Page</h1>
        <ProfileForm
          profile={profile}
          onSubmit={handleUpdateProfile}
          submitText={"Update"}
        />
      </div>
    );
  }

  return (
    <div className="formPage">
      <h1>Profile Page</h1>
      <div className="profileContainer">
        <img src={profile.avatar_url} alt="Avatar" />
        <div className="profileItems">
          <p>
            User name: <span>{profile.name || "Anonymous"}</span>
          </p>
          <p>
            Address: <span>{profile.address}</span>
          </p>
          <p>
            Birthday: <span>{profile.birthday}</span>
          </p>
          {isCurrentUser && (
            <button onClick={() => setShowForm(true)}>Edit profile</button>
          )}
        </div>
      </div>
      {isCurrentUser && <DeleteAccount />}
    </div>
  );
}
