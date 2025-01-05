import React, { useState } from "react";

export default function ProfileForm({ profile, onSubmit, submitText }) {
  const [formData, setFormData] = useState({
    address: profile.address || "",
    birthday: profile.birthday || "",
    avatar: null,
  });
  const [formErrors, setFormErrors] = useState({});

  const validateForm = (data) => {
    const errors = {};

    if (!data.address.trim()) {
      errors.address = "Address is required";
    }

    if (!data.birthday) {
      errors.birthday = "Birthday is required";
    }

    return errors;
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value,
    });
    setFormErrors({
      ...formErrors,
      [name]: "",
    });
  };

  const handleImageChange = (event) => {
    const selectedImage = event.target.files[0];
    setFormData({
      ...formData,
      avatar: selectedImage,
    });
  };

  const handleRemoveImage = () => {
    setFormData({
      ...formData,
      avatar: null,
    });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const newErrors = validateForm(formData);
    setFormErrors(newErrors);

    if (Object.keys(newErrors).length === 0) {
      onSubmit(formData);
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      <div>
        <input
          type="text"
          name="address"
          id="address"
          value={formData.address}
          placeholder="Address"
          onChange={handleChange}
        />
        {formErrors.address && (
          <span className="error-message">{formErrors.address}</span>
        )}
      </div>
      <div>
        <input
          type="date"
          name="birthday"
          id="birthday"
          value={formData.birthday}
          onChange={handleChange}
          data-testid="birthday-input"
        />
        {formErrors.birthday && (
          <span className="error-message">{formErrors.birthday}</span>
        )}
      </div>
      {formData.avatar && (
        <div>
          <img
            alt="not found"
            width={"250px"}
            src={URL.createObjectURL(formData.avatar)}
          />
          <button type="button" onClick={handleRemoveImage}>
            Remove
          </button>
        </div>
      )}
      <div>
        <input
          type="file"
          name="avatar"
          data-testid="avatar-input"
          onChange={handleImageChange}
        />
      </div>
      <button type="submit">{submitText}</button>
    </form>
  );
}
