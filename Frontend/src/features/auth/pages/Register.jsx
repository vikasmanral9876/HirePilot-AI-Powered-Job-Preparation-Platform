import React, { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router";
import { useAuth } from "../hooks/useAuth";
import "../auth.form.scss";
import {
  Logo,
  User,
  Mail,
  Lock,
  Eye,
  EyeOff,
  AlertCircle,
  Loader2,
  ArrowRight,
} from "../../../components/ui/Icons";

const Register = () => {
  const { user, loading, handleRegister } = useAuth();
  const navigate = useNavigate();

  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  // If already logged in, redirect directly to dashboard
  useEffect(() => {
    if (user) {
      navigate("/dashboard", { replace: true });
    }
  }, [user, navigate]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMessage("");

    if (!username.trim() || !email.trim() || !password) {
      setErrorMessage("Please fill in all required fields.");
      return;
    }

    if (password.length < 6) {
      setErrorMessage("Password must be at least 6 characters long.");
      return;
    }

    const result = await handleRegister({
      username: username.trim(),
      email: email.trim(),
      password,
    });

    if (result.success) {
      navigate("/dashboard", { replace: true });
    } else {
      setErrorMessage(result.error || "Failed to create account. Please try again.");
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
          <h1>Create your account</h1>
          <p>Get started with personalized AI-powered interview preparation</p>
        </header>

        {/* Error Alert */}
        {errorMessage && (
          <div className="auth-card__alert auth-card__alert--error">
            <AlertCircle size={18} />
            <span>{errorMessage}</span>
          </div>
        )}

        {/* Register Form */}
        <form onSubmit={handleSubmit} noValidate>
          {/* Username Input */}
          <div className="input-field">
            <div className="input-field__header">
              <label htmlFor="username">Full name or username</label>
            </div>
            <div className="input-field__control">
              <span className="input-icon">
                <User size={18} />
              </span>
              <input
                id="username"
                type="text"
                name="username"
                autoComplete="username"
                autoFocus
                placeholder="e.g. Alex Morgan"
                value={username}
                onChange={(e) => {
                  setUsername(e.target.value);
                  if (errorMessage) setErrorMessage("");
                }}
                disabled={loading}
              />
            </div>
          </div>

          {/* Email Input */}
          <div className="input-field">
            <div className="input-field__header">
              <label htmlFor="email">Work or personal email</label>
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
                placeholder="alex@example.com"
                value={email}
                onChange={(e) => {
                  setEmail(e.target.value);
                  if (errorMessage) setErrorMessage("");
                }}
                disabled={loading}
              />
            </div>
          </div>

          {/* Password Input */}
          <div className="input-field">
            <div className="input-field__header">
              <label htmlFor="password">Password</label>
            </div>
            <div className="input-field__control">
              <span className="input-icon">
                <Lock size={18} />
              </span>
              <input
                id="password"
                type={showPassword ? "text" : "password"}
                name="password"
                autoComplete="new-password"
                placeholder="At least 6 characters"
                value={password}
                onChange={(e) => {
                  setPassword(e.target.value);
                  if (errorMessage) setErrorMessage("");
                }}
                disabled={loading}
              />
              <button
                type="button"
                className="toggle-password"
                onClick={() => setShowPassword((prev) => !prev)}
                title={showPassword ? "Hide password" : "Show password"}
                aria-label={showPassword ? "Hide password" : "Show password"}
                tabIndex={0}
              >
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
            <span className="field-hint">Must contain at least 6 characters</span>
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            className="auth-submit-btn"
            disabled={loading}
          >
            {loading ? (
              <>
                <Loader2 size={18} />
                <span>Creating account...</span>
              </>
            ) : (
              <>
                <span>Get started</span>
                <ArrowRight size={16} />
              </>
            )}
          </button>
        </form>

        {/* Footer */}
        <footer className="auth-card__footer">
          Already have an account?{" "}
          <Link to="/login">Sign in instead</Link>
        </footer>
      </div>
    </main>
  );
};

export default Register;
