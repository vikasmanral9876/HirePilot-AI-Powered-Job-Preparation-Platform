import { useEffect, useRef } from "react";
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
  const onCloseRef = useRef(onClose);

  // Keep callback reference updated without resetting the auto-dismiss timer
  useEffect(() => {
    onCloseRef.current = onClose;
  }, [onClose]);

  // Stable dismiss timer dependent only on message and duration
  useEffect(() => {
    if (!message || !duration) return;
    const timer = setTimeout(() => {
      onCloseRef.current?.();
    }, duration);
    return () => clearTimeout(timer);
  }, [message, duration]);

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
