import React, { useContext, useState } from "react";
import { useNavigate } from "react-router-dom";
import { AppContext } from "./AppContext";
import { api } from "../api";

// Shown on the user's own profile. Asks for their password before deleting
// the account along with their profile and messages.
export default function DeleteAccount() {
  const { handleSuccessfulLogOut } = useContext(AppContext);
  const navigate = useNavigate();
  const [confirming, setConfirming] = useState(false);
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  const handleSubmit = (e) => {
    e.preventDefault();

    api
      .delete("/api/account", { password })
      .then(() => {
        handleSuccessfulLogOut();
        navigate("/");
      })
      .catch((error) => setError(error.message));
  };

  const handleCancel = () => {
    setConfirming(false);
    setPassword("");
    setError("");
  };

  return (
    <div className="deleteAccount">
      {confirming ? (
        <form onSubmit={handleSubmit}>
          <p>
            This permanently deletes your account, your profile and every
            message you've sent. Enter your password to confirm.
          </p>
          {error && <span className="error-message">{error}</span>}
          <input
            type="password"
            aria-label="Password"
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            autoFocus
          />
          <div className="deleteAccountActions">
            <button type="button" onClick={handleCancel}>
              Cancel
            </button>
            <button type="submit" className="danger" disabled={!password}>
              Delete permanently
            </button>
          </div>
        </form>
      ) : (
        <button className="danger" onClick={() => setConfirming(true)}>
          Delete account
        </button>
      )}
    </div>
  );
}
