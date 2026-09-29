import { useState } from "react";
import { Link } from "react-router";
import { forgotPassword } from "../services/auth.api";
import "../auth.form.scss";
import {
  Logo,
  Mail,
  AlertCircle,
  CheckCircle2,
  Loader2,
  ArrowLeft,
  ArrowRight,
} from "../../../components/ui/Icons";

const ForgotPassword = () => {
  const [email, setEmail] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submittedEmail, setSubmittedEmail] = useState("");
  const [errorMessage, setErrorMessage] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMessage("");

    if (!email.trim()) {
      setErrorMessage("Please enter your registered email address.");
      return;
    }

    setIsSubmitting(true);
    try {
      await forgotPassword({ email: email.trim() });
      setSubmittedEmail(email.trim());
    } catch (err) {
      setErrorMessage(
        err.message || "Failed to submit reset request. Please try again."
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <main className="auth-page">
      <div className="auth-card">
        {/* Brand Header */}
        <header className="auth-card__header">
          <div className="brand-pill">
            <Logo size={22} />
            <span className="brand-name">HirePilot</span>
            <span className="ai-badge">AI</span>
          </div>
          <h1>{submittedEmail ? "Check your inbox" : "Reset your password"}</h1>
          <p>
            {submittedEmail
              ? `We have sent password recovery instructions to ${submittedEmail}.`
              : "Enter your account email and we'll send you instructions to reset your password."}
          </p>
        </header>

        {/* Error Alert */}
        {errorMessage && (
          <div className="auth-card__alert auth-card__alert--error">
            <AlertCircle size={18} />
            <span>{errorMessage}</span>
          </div>
        )}

        {submittedEmail ? (
          /* Success Screen */
          <div style={{ display: "flex", flexDirection: "column", gap: "1.25rem" }}>
            <div className="auth-card__alert auth-card__alert--success">
              <CheckCircle2 size={20} />
              <span>
                If an account exists for {submittedEmail}, you'll receive a password reset link shortly.
              </span>
            </div>

            <button
              type="button"
              className="auth-submit-btn"
              onClick={() => {
                setSubmittedEmail("");
                setEmail("");
              }}
            >
              <span>Send to another email</span>
            </button>

            <div style={{ textAlign: "center", marginTop: "0.5rem" }}>
              <Link
                to="/login"
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: "0.4rem",
                  fontSize: "0.85rem",
                  color: "#ff6b9d",
                  fontWeight: 600,
                }}
              >
                <ArrowLeft size={16} />
                <span>Return to sign in</span>
              </Link>
            </div>
          </div>
        ) : (
          /* Reset Form */
          <form onSubmit={handleSubmit} noValidate>
            <div className="input-field">
              <div className="input-field__header">
                <label htmlFor="email">Registered email address</label>
              </div>
              <div className="input-field__control">
                <span className="input-icon">
                  <Mail size={18} />
                </span>
                <input
                  id="email"
                  type="email"
                  name="email"
                  autoComplete="email"
                  autoFocus
                  placeholder="name@company.com"
                  value={email}
                  onChange={(e) => {
                    setEmail(e.target.value);
                    if (errorMessage) setErrorMessage("");
                  }}
                  disabled={isSubmitting}
                />
              </div>
            </div>

            <button
              type="submit"
              className="auth-submit-btn"
              disabled={isSubmitting}
            >
              {isSubmitting ? (
                <>
                  <Loader2 size={18} />
                  <span>Sending instructions...</span>
                </>
              ) : (
                <>
                  <span>Send reset instructions</span>
                  <ArrowRight size={16} />
                </>
              )}
            </button>
          </form>
        )}

        {/* Footer */}
        {!submittedEmail && (
          <footer className="auth-card__footer">
            <Link
              to="/login"
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: "0.4rem",
              }}
            >
              <ArrowLeft size={14} />
              <span>Back to sign in</span>
            </Link>
          </footer>
        )}
      </div>
    </main>
  );
};

export default ForgotPassword;
