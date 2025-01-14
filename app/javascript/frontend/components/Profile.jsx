import React, { useState, useContext, useEffect } from "react";
import { Navigate, useParams } from "react-router-dom";
import { AppContext } from "./AppContext";
import ProfileForm from "./ProfileForm";

export default function Profile() {
  const { id } = useParams();
  const [profile, setProfile] = useState({});
  const [showForm, setShowForm] = useState(false);
  const { user, loggedInStatus, url } = useContext(AppContext);

  if (loggedInStatus === "NOT_LOGGED_IN") {
    return <Navigate to="/" replace />;
  }

  const isCurrentUser = user.id === parseInt(id);

  useEffect(() => {
    fetch(`${url}/api/profiles/${id}`)
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

    fetch(`${url}/api/profiles/`, {
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

    fetch(`${url}/api/profiles/${profile.id}`, {
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
            User name: <span>{user.name || "Anonymous"}</span>
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
    </div>
  );
}
