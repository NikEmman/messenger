import React, { useContext, useState, useEffect } from "react";
import "../styles/Profile.css";
import { Link, useNavigate } from "react-router-dom";
import { AppContext } from "./AppContext";
import { api } from "../api";

export default function Login() {
  const [formData, setFormData] = useState({
    email: "",
    password: "",
  });
  const [formErrors, setFormErrors] = useState({});
  const [loginError, setLoginError] = useState("");

  const { handleSuccessfulAuth, loggedInStatus, user } =
    useContext(AppContext);
  const navigate = useNavigate();
  const messagesRouter = () => navigate("/messages");

  //checks if user exists(logged in)
  useEffect(() => {
    if (Object.keys(user).length > 0) {
      navigate("/messages");
    }
  }, [user]);

  const validateForm = (data) => {
    const errors = {};

    if (!data.email.trim()) {
      errors.email = "Email is required";
    } else if (!/\S+@\S+\.\S+/.test(data.email)) {
      errors.email = "Email is invalid";
    }

    if (!data.password) {
      errors.password = "Password is required";
    }

    return errors;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    setLoginError("");
    const newErrors = validateForm(formData);
    setFormErrors(newErrors);

    if (Object.keys(newErrors).length === 0) {
      const data = {
        user: {
          email: formData.email,
          password: formData.password,
        },
      };

      api
        .post("/api/sessions", data)
        .then((data) => {
          handleSuccessfulAuth(data.user);
          messagesRouter();
        })
        .catch((error) => {
          setLoginError(
            error.status === 401 ? "Wrong email or password" : error.message
          );
        });
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value,
    });
    setFormErrors({});
    setLoginError("");
  };

  return loggedInStatus === "LOGGED_IN" ? (
    <>
      <h1>You are already logged in</h1>
      <Link to="/messages">Messages</Link>
    </>
  ) : (
    <div className="formPage">
      <h1>Sign in</h1>
      {loginError && <p className="error-message">{loginError}</p>}
      <form action="/" method="post" onSubmit={handleSubmit}>
        <label htmlFor="email">
          <input
            type="text"
            name="email"
            id="email"
            onChange={handleChange}
            value={formData.email}
            placeholder="Email"
          />
        </label>
        {formErrors.email && (
          <span className="error-message">{formErrors.email}</span>
        )}

        <label htmlFor="password">
          <input
            type="password"
            name="password"
            id="password"
            onChange={handleChange}
            value={formData.password}
            placeholder="Password"
          />
        </label>
        {formErrors.password && (
          <span className="error-message">{formErrors.password}</span>
        )}

        <button type="submit">Sign In</button>
      </form>
      <Link to="/signup">Create new account</Link>
    </div>
  );
}
