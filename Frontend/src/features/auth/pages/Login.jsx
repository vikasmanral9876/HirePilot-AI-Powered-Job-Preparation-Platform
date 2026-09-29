import { useState, useEffect, useRef } from "react";
import { Link, useNavigate } from "react-router";
import { useAuth } from "../hooks/useAuth";
import "../auth.form.scss";
import {
  Logo,
  Mail,
  Lock,
  Eye,
  EyeOff,
  AlertCircle,
  Loader2,
  ArrowRight,
} from "../../../components/ui/Icons";

const Login = () => {
  const { user, loading, handleLogin, handleGoogleLogin } = useAuth();
  const navigate = useNavigate();
  const googleBtnRef = useRef(null);

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  const clientId = import.meta.env.VITE_GOOGLE_CLIENT_ID;

  const handleGoogleLoginRef = useRef(handleGoogleLogin);
  useEffect(() => {
    handleGoogleLoginRef.current = handleGoogleLogin;
  }, [handleGoogleLogin]);

  const navigateRef = useRef(navigate);
  useEffect(() => {
    navigateRef.current = navigate;
  }, [navigate]);

  // If already logged in, redirect directly to dashboard
  useEffect(() => {
    if (user) {
      navigate("/dashboard", { replace: true });
    }
  }, [user, navigate]);

  // Initialize Google Identity Services
  useEffect(() => {
    if (!clientId) {
      return;
    }

    let isCancelled = false;

    const setupGoogleSignIn = () => {
      if (isCancelled || !window.google?.accounts?.id) return;

      try {
        // Initialize Google Identity Services only once per application lifecycle
        if (window.__hirepilot_gsi_client_id !== clientId) {
          window.google.accounts.id.initialize({
            client_id: clientId,
            callback: async (response) => {
              if (response?.credential) {
                setErrorMessage("");
                const result = await handleGoogleLoginRef.current({ idToken: response.credential });
                if (result.success) {
                  navigateRef.current("/dashboard", { replace: true });
                } else {
                  setErrorMessage(result.error || "Google sign-in failed.");
                }
              }
            },
          });
          window.__hirepilot_gsi_client_id = clientId;
        }

        // Render official Google button into the mounted DOM container
        if (googleBtnRef.current) {
          googleBtnRef.current.innerHTML = "";
          window.google.accounts.id.renderButton(googleBtnRef.current, {
            theme: "filled_black",
            size: "large",
            type: "standard",
            shape: "rectangular",
            text: "continue_with",
            logo_alignment: "left",
            width: googleBtnRef.current.offsetWidth || 376,
          });
        }
      } catch (err) {
        console.error("Error initializing Google Identity Services:", err?.message || err);
      }
    };

    if (window.google?.accounts?.id) {
      setupGoogleSignIn();
    } else {
      const timer = setInterval(() => {
        if (window.google?.accounts?.id) {
          clearInterval(timer);
          setupGoogleSignIn();
        }
      }, 100);
      return () => {
        isCancelled = true;
        clearInterval(timer);
      };
    }

    return () => {
      isCancelled = true;
    };
  }, [clientId]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMessage("");

    if (!email.trim() || !password) {
      setErrorMessage("Please enter both email and password.");
      return;
    }

    const result = await handleLogin({ email: email.trim(), password });
    if (result.success) {
      navigate("/dashboard", { replace: true });
    } else {
      setErrorMessage(result.error || "Invalid email or password.");
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
          <h1>Welcome back</h1>
          <p>Sign in to your account to continue your interview preparation</p>
        </header>

        {/* Error Alert */}
        {errorMessage && (
          <div className="auth-card__alert auth-card__alert--error">
            <AlertCircle size={18} />
            <span>{errorMessage}</span>
          </div>
        )}

        {/* Google Authentication */}
        <div className="google-auth-container">
          <div ref={googleBtnRef} className="google-btn-slot" />
        </div>

        {/* Divider */}
        <div className="auth-divider">
          <span className="auth-divider__line" />
          <span className="auth-divider__text">or continue with email</span>
          <span className="auth-divider__line" />
        </div>

        {/* Login Form */}
        <form onSubmit={handleSubmit} noValidate>
          {/* Email Input */}
          <div className="input-field">
            <div className="input-field__header">
              <label htmlFor="email">Email address</label>
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
                disabled={loading}
              />
            </div>
          </div>

          {/* Password Input */}
          <div className="input-field">
            <div className="input-field__header">
              <label htmlFor="password">Password</label>
              <Link to="/forgot-password" className="forgot-link">
                Forgot password?
              </Link>
            </div>
            <div className="input-field__control">
              <span className="input-icon">
                <Lock size={18} />
              </span>
              <input
                id="password"
                type={showPassword ? "text" : "password"}
                name="password"
                autoComplete="current-password"
                placeholder="••••••••"
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
                <span>Signing in...</span>
              </>
            ) : (
              <>
                <span>Sign in</span>
                <ArrowRight size={16} />
              </>
            )}
          </button>
        </form>

        {/* Footer */}
        <footer className="auth-card__footer">
          Don't have an account?{" "}
          <Link to="/register">Create an account</Link>
        </footer>
      </div>
    </main>
  );
};

export default Login;
