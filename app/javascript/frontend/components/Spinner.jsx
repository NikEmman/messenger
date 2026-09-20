import React from "react";
import "../styles/Spinner.css";

export default function Spinner({ label = "Loading...", className = "" }) {
  return (
    <div
      className={`spinnerContainer ${className}`.trim()}
      role="status"
      aria-live="polite"
    >
      <span className="spinner" />
      <span className="spinnerLabel">{label}</span>
    </div>
  );
}
