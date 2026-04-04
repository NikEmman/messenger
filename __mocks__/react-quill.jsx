import React from "react";

export default function ReactQuill({ value, onChange }) {
  return (
    <textarea
      value={value}
      onChange={(e) => onChange(e.target.value)}
      data-testid="quill-editor"
    />
  );
}
