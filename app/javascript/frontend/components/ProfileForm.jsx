import React, { useState } from "react";
export default function ProfileForm({ profile, onSubmit, submitText }) {
  const [formData, setFormData] = useState({
    address: profile.address || "",
    work: profile.work || "",
    hobby: profile.hobby || "",
  });

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value,
    });
  };

  <form action="/">
    <input
      type="text"
      name="address"
      id="address"
      value={formData.address}
      onChange={handleChange}
    />
    <input
      type="text"
      name="work"
      id="work"
      value={formData.work}
      onChange={handleChange}
    />
    <input
      type="text"
      name="hobby"
      id="hobby"
      value={formData.hobby}
      onChange={handleChange}
    />
    <button onClick={onSubmit}>{submitText}</button>
  </form>;
}
