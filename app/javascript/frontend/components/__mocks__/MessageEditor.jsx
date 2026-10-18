import React from "react";

// jsdom has no <trix-editor>; a textarea with the same contract stands in.
export default function MessageEditor({ value, onChange, onSubmit, placeholder }) {
  return (
    <textarea
      data-testid="message-editor"
      placeholder={placeholder}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      onKeyDown={(e) => {
        if (e.key === "Enter" && !e.shiftKey) {
          e.preventDefault();
          onSubmit(e.target.value);
        }
      }}
    />
  );
}
