import { useState, useEffect } from "react";
import { useNavigate } from "react-router";
import { useAuth } from "../../auth/hooks/useAuth";
import { useCandidateProfile } from "../../profile/hooks/useCandidateProfile";
import "../settings.scss";
import {
  Settings as SettingsIcon,
  User as UserIcon,
  Moon,
  LogOut,
  Save,
  CheckCircle2,
  AlertCircle,
  Check,
  Lock,
  Sparkles,
} from "../../../components/ui/Icons";

const Settings = () => {
  const { user, updateUserData, handleLogout } = useAuth();
  const { profile, updateProfileFields } = useCandidateProfile();
  const navigate = useNavigate();

  const [activeTab, setActiveTab] = useState("account"); // 'account' | 'appearance' | 'logout'
  const [toastMessage, setToastMessage] = useState("");
  const [errorMessage, setErrorMessage] = useState("");

  const showToast = (msg) => {
    setToastMessage(msg);
    setErrorMessage("");
    setTimeout(() => setToastMessage(""), 3500);
  };

  const showError = (msg) => {
    setErrorMessage(msg);
    setTimeout(() => setErrorMessage(""), 4000);
  };

  const userId = user?.id || user?._id || user?.email || "anonymous";

  // Account form state
  const [accountForm, setAccountForm] = useState({
    username: user?.username || "Candidate",
    email: user?.email || "candidate@hirepilot.ai",
    preferredRole: profile?.title || "",
    location: profile?.location || "",
    timezone: "UTC-08:00 (Pacific Time - Los Angeles)",
  });

  // Sync state if user or profile updates
  useEffect(() => {
    const savedTimezone =
      localStorage.getItem(`hirepilot_timezone_${userId}`) ||
      localStorage.getItem("hirepilot_timezone");
    setAccountForm((prev) => ({
      ...prev,
      username: user?.username || prev.username,
      email: user?.email || prev.email,
      preferredRole: profile?.title || "",
      location: profile?.location || "",
      timezone: savedTimezone || prev.timezone,
    }));
  }, [user, profile, userId]);

  // Appearance state (Only 2 themes: Default Neon & Cyber Cyan)
  const [selectedTheme, setSelectedTheme] = useState(() => {
    try {
      return localStorage.getItem("hirepilot_theme") || "neon";
    } catch (e) {
      console.error(e);
      return "neon";
    }
  });

  // Save account changes
  const handleSaveAccount = (e) => {
    e.preventDefault();
    if (!accountForm.username.trim()) {
      showError("Please enter a valid display name.");
      return;
    }

    try {
      // 1. Update user display name in auth context & storage
      if (updateUserData) {
        updateUserData({ username: accountForm.username.trim() });
      }

      // 2. Sync title & location to candidate profile
      if (updateProfileFields) {
        updateProfileFields({
          title: accountForm.preferredRole.trim(),
          location: accountForm.location.trim(),
        });
      }

      // 3. Save timezone
      localStorage.setItem(`hirepilot_timezone_${userId}`, accountForm.timezone);

      showToast("Account preferences updated successfully");
    } catch (err) {
      console.error("Failed to save settings:", err);
      showError("Failed to save account changes. Please try again.");
    }
  };

  // Switch Theme (Works immediately on document root and persists)
  const handleThemeChange = (themeKey) => {
    setSelectedTheme(themeKey);
    try {
      localStorage.setItem("hirepilot_theme", themeKey);
      document.documentElement.setAttribute("data-theme", themeKey);
      const name = themeKey === "cyan" ? "Cyber Cyan" : "HirePilot Neon";
      showToast(`${name} theme applied`);
    } catch (e) {
      console.error("Failed to apply theme:", e);
    }
  };

  const [isLoggingOut, setIsLoggingOut] = useState(false);

  // Sign out confirmation
  const onConfirmLogout = async () => {
    if (isLoggingOut) return;
    setIsLoggingOut(true);
    try {
      await handleLogout();
    } finally {
      setIsLoggingOut(false);
      navigate("/login", { replace: true });
    }
  };

  return (
    <div className="settings-page">
      {/* Toast Feedback */}
      {toastMessage && (
        <div className="profile-toast">
          <CheckCircle2 size={16} />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Error Feedback */}
      {errorMessage && (
        <div
          style={{
            position: "fixed",
            top: "24px",
            right: "24px",
            background: "#1f1315",
            border: "1px solid rgba(239, 68, 68, 0.4)",
            color: "#f87171",
            padding: "12px 18px",
            borderRadius: "10px",
            zIndex: 1000,
            display: "flex",
            alignItems: "center",
            gap: "8px",
            fontSize: "13px",
            boxShadow: "0 8px 24px rgba(0,0,0,0.5)",
          }}
        >
          <AlertCircle size={16} />
          <span>{errorMessage}</span>
        </div>
      )}

      {/* Header */}
      <section className="settings-header">
        <div className="settings-header__badge">
          <SettingsIcon size={13} />
          <span>Platform Settings</span>
        </div>
        <h1>Settings & Preferences</h1>
        <p>
          Manage your account profile information, target position preferences, and interface appearance.
        </p>
      </section>

      {/* Settings Grid */}
      <div className="settings-layout">
        {/* Navigation Tabs */}
        <aside className="settings-tabs">
          <button
            type="button"
            className={`settings-tabs__tab ${
              activeTab === "account" ? "settings-tabs__tab--active" : ""
            }`}
            onClick={() => setActiveTab("account")}
          >
            <UserIcon size={16} />
            <span>Account Settings</span>
          </button>

          <button
            type="button"
            className={`settings-tabs__tab ${
              activeTab === "appearance" ? "settings-tabs__tab--active" : ""
            }`}
            onClick={() => setActiveTab("appearance")}
          >
            <Moon size={16} />
            <span>Appearance</span>
          </button>

          <div style={{ height: "1px", background: "rgba(255,255,255,0.06)", margin: "6px 0" }} />

          <button
            type="button"
            className={`settings-tabs__tab settings-tabs__tab--danger ${
              activeTab === "logout" ? "settings-tabs__tab--active-danger" : ""
            }`}
            onClick={() => setActiveTab("logout")}
          >
            <LogOut size={16} />
            <span>Sign Out</span>
          </button>
        </aside>

        {/* Content Area */}
        <main className="settings-content">
          {/* TAB 1: ACCOUNT SETTINGS */}
          {activeTab === "account" && (
            <div>
              <div className="settings-content__header">
                <h2>Account Settings</h2>
                <p>Update your personal information and default career role preferences.</p>
              </div>

              <form className="settings-form" onSubmit={handleSaveAccount}>
                <div className="form-row">
                  <div className="form-group">
                    <label htmlFor="username">Full Name / Username</label>
                    <input
                      id="username"
                      type="text"
                      required
                      placeholder="e.g. Jane Doe"
                      value={accountForm.username}
                      onChange={(e) =>
                        setAccountForm((prev) => ({ ...prev, username: e.target.value }))
                      }
                    />
                  </div>

                  <div className="form-group">
                    <label htmlFor="email">Email Address</label>
                    <div style={{ position: "relative" }}>
                      <input
                        id="email"
                        type="email"
                        disabled
                        value={accountForm.email}
                        style={{ paddingRight: "36px" }}
                        title="Email address is associated with your primary HirePilot credentials"
                      />
                      <span
                        style={{
                          position: "absolute",
                          right: "12px",
                          top: "50%",
                          transform: "translateY(-50%)",
                          color: "#6b7280",
                          display: "flex",
                          alignItems: "center",
                        }}
                        title="Managed via primary authentication credentials"
                      >
                        <Lock size={14} />
                      </span>
                    </div>
                    <span className="hint">Managed via primary authentication credentials</span>
                  </div>
                </div>

                <div className="form-row">
                  <div className="form-group">
                    <label htmlFor="preferredRole">Target Position Title</label>
                    <input
                      id="preferredRole"
                      type="text"
                      placeholder="e.g. Senior Full Stack Engineer"
                      value={accountForm.preferredRole}
                      onChange={(e) =>
                        setAccountForm((prev) => ({ ...prev, preferredRole: e.target.value }))
                      }
                    />
                  </div>

                  <div className="form-group">
                    <label htmlFor="location">Location / Work Mode</label>
                    <input
                      id="location"
                      type="text"
                      placeholder="e.g. San Francisco, CA (Remote)"
                      value={accountForm.location}
                      onChange={(e) =>
                        setAccountForm((prev) => ({ ...prev, location: e.target.value }))
                      }
                    />
                  </div>
                </div>

                <div className="form-group">
                  <label htmlFor="timezone">Timezone</label>
                  <select
                    id="timezone"
                    value={accountForm.timezone}
                    onChange={(e) =>
                      setAccountForm((prev) => ({ ...prev, timezone: e.target.value }))
                    }
                  >
                    <option value="UTC-08:00 (Pacific Time - Los Angeles)">
                      UTC-08:00 (Pacific Time - Los Angeles)
                    </option>
                    <option value="UTC-05:00 (Eastern Time - New York)">
                      UTC-05:00 (Eastern Time - New York)
                    </option>
                    <option value="UTC+00:00 (London, Dublin)">
                      UTC+00:00 (London, Dublin)
                    </option>
                    <option value="UTC+01:00 (Central European Time - Berlin)">
                      UTC+01:00 (Central European Time - Berlin)
                    </option>
                    <option value="UTC+05:30 (India Standard Time - New Delhi)">
                      UTC+05:30 (India Standard Time - New Delhi)
                    </option>
                    <option value="UTC+08:00 (Singapore / Hong Kong)">
                      UTC+08:00 (Singapore / Hong Kong)
                    </option>
                    <option value="UTC+09:00 (Tokyo, Seoul)">
                      UTC+09:00 (Tokyo, Seoul)
                    </option>
                  </select>
                </div>

                <div style={{ marginTop: "8px" }}>
                  <button type="submit" className="btn-primary">
                    <Save size={14} />
                    <span>Save Account Changes</span>
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* TAB 2: APPEARANCE (ONLY 2 THEMES: DEFAULT & 1 EXTRA) */}
          {activeTab === "appearance" && (
            <div>
              <div className="settings-content__header">
                <h2>Interface & Appearance</h2>
                <p>Choose your workspace accent theme. Changes apply instantly across the entire platform.</p>
              </div>

              <div className="appearance-section">
                <label className="section-label">Select Accent Theme</label>
                <div className="theme-cards-grid">
                  {/* Theme 1: HirePilot Neon (Default) */}
                  <div
                    className={`theme-card ${
                      selectedTheme === "neon" ? "theme-card--active" : ""
                    }`}
                    onClick={() => handleThemeChange("neon")}
                    role="button"
                    tabIndex={0}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" || e.key === " ") handleThemeChange("neon");
                    }}
                  >
                    <div className="theme-card__header">
                      <div className="theme-card__swatch" style={{ background: "#ff2d78" }} />
                      <div className="theme-card__status">
                        {selectedTheme === "neon" && (
                          <span className="active-pill">
                            <Check size={12} />
                            <span>Active</span>
                          </span>
                        )}
                      </div>
                    </div>
                    <div className="theme-card__body">
                      <h3>HirePilot Neon (Default)</h3>
                      <p>Signature dark interface with vibrant neon magenta buttons, highlights, and borders.</p>
                    </div>
                  </div>

                  {/* Theme 2: Cyber Cyan (1 Extra Theme) */}
                  <div
                    className={`theme-card ${
                      selectedTheme === "cyan" ? "theme-card--active" : ""
                    }`}
                    onClick={() => handleThemeChange("cyan")}
                    role="button"
                    tabIndex={0}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" || e.key === " ") handleThemeChange("cyan");
                    }}
                  >
                    <div className="theme-card__header">
                      <div className="theme-card__swatch" style={{ background: "#06b6d4" }} />
                      <div className="theme-card__status">
                        {selectedTheme === "cyan" && (
                          <span className="active-pill" style={{ color: "#06b6d4", background: "rgba(6, 182, 212, 0.12)", borderColor: "rgba(6, 182, 212, 0.3)" }}>
                            <Check size={12} />
                            <span>Active</span>
                          </span>
                        )}
                      </div>
                    </div>
                    <div className="theme-card__body">
                      <h3>Cyber Cyan</h3>
                      <p>Cool midnight interface with electric cyan accents, indicators, and buttons.</p>
                    </div>
                  </div>
                </div>

                <div className="theme-note">
                  <Sparkles size={14} />
                  <span>Theme preferences are stored locally and will persist automatically across sessions.</span>
                </div>
              </div>
            </div>
          )}

          {/* TAB 3: SIGN OUT */}
          {activeTab === "logout" && (
            <div>
              <div className="settings-content__header">
                <h2>Account Sign Out</h2>
                <p>Terminating your session will safely clear your secure cookies and return you to the login screen.</p>
              </div>

              <div className="danger-zone">
                <h3>Sign Out from HirePilot</h3>
                <p>
                  Are you sure you want to log out? Your interview plans, candidate profile, and roadmap milestones are safely stored in your account.
                </p>

                <button
                  type="button"
                  className="btn-danger"
                  onClick={onConfirmLogout}
                  disabled={isLoggingOut}
                >
                  <LogOut size={14} />
                  <span>{isLoggingOut ? "Signing Out..." : "Confirm Sign Out"}</span>
                </button>
              </div>
            </div>
          )}
        </main>
      </div>
    </div>
  );
};

export default Settings;
