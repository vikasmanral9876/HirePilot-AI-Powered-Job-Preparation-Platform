import React, { useEffect } from "react";
import { CheckCircle2, AlertCircle, Sparkles, X } from "./Icons";

/**
 * Reusable accessible toast notification component for HirePilot
 * Types: "success" | "error" | "info" | "warning"
 */
const Toast = ({
  message,
  type = "info",
  onClose,
  duration = 4000,
}) => {
  useEffect(() => {
    if (!message || !duration || !onClose) return;
    const timer = setTimeout(() => {
      onClose();
    }, duration);
    return () => clearTimeout(timer);
  }, [message, duration, onClose]);

  if (!message) return null;

  const isError = type === "error";

  return (
    <div
      className={`hirepilot-toast hirepilot-toast--${type}`}
      role={isError ? "alert" : "status"}
      aria-live={isError ? "assertive" : "polite"}
    >
      <div className="hirepilot-toast__icon">
        {type === "success" && <CheckCircle2 size={16} />}
        {type === "error" && <AlertCircle size={16} />}
        {type === "warning" && <AlertCircle size={16} />}
        {type === "info" && <Sparkles size={16} />}
      </div>
      <span className="hirepilot-toast__message">{message}</span>
      {onClose && (
        <button
          type="button"
          className="hirepilot-toast__close"
          onClick={onClose}
          aria-label="Dismiss notification"
        >
          <X size={14} />
        </button>
      )}
    </div>
  );
};

export default Toast;
