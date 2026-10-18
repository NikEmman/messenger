import React, { useEffect, useId, useRef } from "react";

// Rich-text input backed by Trix (loaded globally in application.js).
// Enter sends; Shift+Enter inserts a line break. onSubmit receives the editor's
// current HTML, since Trix reports changes asynchronously.
export default function MessageEditor({ value, onChange, onSubmit, placeholder }) {
  const wrapperRef = useRef(null);
  const editorRef = useRef(null);
  const inputId = `message-input-${useId().replace(/:/g, "")}`;
  // Latest callbacks, so the DOM listeners below are attached only once.
  const callbacks = useRef({ onChange, onSubmit });
  callbacks.current = { onChange, onSubmit };

  useEffect(() => {
    const wrapper = wrapperRef.current;
    const editor = editorRef.current;
    const handleChange = () => callbacks.current.onChange(editor.value);
    // Capture phase on the wrapper runs before Trix's own Enter handling.
    const handleKeyDown = (e) => {
      if (e.key === "Enter" && !e.shiftKey && !e.isComposing) {
        e.preventDefault();
        e.stopPropagation();
        // Let Trix flush a just-typed edit (it syncs on the next frame).
        requestAnimationFrame(() => setTimeout(() => callbacks.current.onSubmit(editor.value)));
      }
    };
    const rejectAttachments = (e) => e.preventDefault();

    editor.addEventListener("trix-change", handleChange);
    editor.addEventListener("trix-file-accept", rejectAttachments);
    wrapper.addEventListener("keydown", handleKeyDown, true);
    return () => {
      editor.removeEventListener("trix-change", handleChange);
      editor.removeEventListener("trix-file-accept", rejectAttachments);
      wrapper.removeEventListener("keydown", handleKeyDown, true);
    };
  }, []);

  // Clear the editor when the parent resets the value (e.g. after sending).
  useEffect(() => {
    const editor = editorRef.current;
    if (value === "" && editor?.editor && editor.value !== "") {
      editor.editor.loadHTML("");
    }
  }, [value]);

  return (
    <div className="messageEditor" ref={wrapperRef}>
      <input type="hidden" id={inputId} />
      <trix-editor
        ref={editorRef}
        input={inputId}
        placeholder={placeholder}
        className="trix-content"
      />
    </div>
  );
}
