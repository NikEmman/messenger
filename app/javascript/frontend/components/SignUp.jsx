import React, { useState, useContext } from "react";
import { AppContext } from "./AppContext";
import { useNavigate } from "react-router-dom";

export default function SignUp() {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
    passwordConfirmation: "",
  });
  const [formErrors, setFormErrors] = useState({});

  const [registrationErrors, setRegistrationErrors] = useState("");
  const { handleSuccessfulAuth } = useContext(AppContext);
  const navigate = useNavigate();
  const messagesRouter = () => navigate("/messages");

  const handleSubmit = (e) => {
    e.preventDefault();

    const data = {
      user: {
        email: formData.email,
        name: formData.name,
        password: formData.password,
        password_confirmation: formData.passwordConfirmation,
      },
    };
    const newErrors = validateForm(formData);
    setFormErrors(newErrors);

    if (Object.keys(newErrors).length === 0) {
      fetch("http://localhost:3000/registrations", {
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
          }
        })
        .catch((error) => {
          setRegistrationErrors(error);
        });
    } else return;
  };
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value,
    });
    setFormErrors({});
  };
  const validateForm = (data) => {
    const errors = {};

    if (!data.name.trim()) {
      errors.name = "Name is required";
    }

    if (!data.email.trim()) {
      errors.email = "Email is required";
    } else if (!/\S+@\S+\.\S+/.test(data.email)) {
      errors.email = "Email is invalid";
    }

    if (!data.password) {
      errors.password = "Password is required";
    }

    if (data.passwordConfirmation !== data.password) {
      errors.passwordConfirmation = "Passwords do not match";
    }

    return errors;
  };

  return (
    <>
      <h1>Sign up</h1>
      {registrationErrors && <p className="error">{registrationErrors}</p>}
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
        <label htmlFor="name">
          <input
            type="name"
            name="name"
            id="name"
            onChange={handleChange}
            value={formData.name}
            placeholder="User name"
          />
        </label>
        {formErrors.name && (
          <span className="error-message">{formErrors.name}</span>
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
        <label htmlFor="password_confirmation">
          <input
            type="password"
            name="passwordConfirmation"
            id="password_confirmation"
            placeholder="Confirm Password"
            value={formData.passwordConfirmation}
            onChange={handleChange}
          />
        </label>
        {formErrors.passwordConfirmation && (
          <span className="error-message">
            {formErrors.passwordConfirmation}
          </span>
        )}

        <button type="submit">Sign Up</button>
      </form>
    </>
  );
}
