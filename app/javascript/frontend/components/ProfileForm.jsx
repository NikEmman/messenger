import React, { useState } from "react";

export default function ProfileForm({ profile, onSubmit, submitText }) {
  const [formData, setFormData] = useState({
    address: profile.address || "",
    birthday: profile.birthday || "",
    avatar: null,
  });

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value,
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

  return (
    <form action="/">
      <input
        type="text"
        name="address"
        id="address"
        value={formData.address}
        placeholder="Address"
        onChange={handleChange}
      />
      <input
        type="date"
        name="birthday"
        id="birthday"
        value={formData.birthday}
        onChange={handleChange}
      />
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
      <input type="file" name="avatar" onChange={handleImageChange} />
      <button
        type="button"
        onClick={() =>
          onSubmit({
            ...formData,
          })
        }
      >
        {submitText}
      </button>
    </form>
  );
}
