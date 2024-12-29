import React, { useContext, useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { AppContext } from "./AppContext";

export default function Login() {
  const [formData, setFormData] = useState({
    email: "",
    password: "",
  });
  const [formErrors, setFormErrors] = useState({});
  const [loginError, setLoginError] = useState("");

  const { handleSuccessfulAuth, loggedInStatus, user } = useContext(AppContext);
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
    console.log("New Errors:", newErrors);
    setFormErrors(newErrors);

    if (Object.keys(newErrors).length === 0) {
      const data = {
        user: {
          email: formData.email,
          password: formData.password,
        },
      };

      fetch("http://localhost:3000/api/sessions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
        credentials: "include",
        mode: "cors",
      })
        .then((response) => response.json())
        .then((data) => {
          if (data.status === "created") {
            handleSuccessfulAuth(data.user);
            messagesRouter();
          } else if (!data.logged_in) {
            setLoginError("Wrong email or password");
          }
        })
        .catch((error) => {
          setLoginError(error.toString());
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
    <>
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
    </>
  );
}
