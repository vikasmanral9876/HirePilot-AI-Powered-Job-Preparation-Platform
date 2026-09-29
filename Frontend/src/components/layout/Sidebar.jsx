import { NavLink, Link, useLocation } from "react-router";
import {
  Logo,
  LayoutDashboard,
  Sparkles,
  BarChart2,
  FileText,
  FileCheck,
  User,
  Settings,
  ChevronLeft,
  ChevronRight,
  X,
  ShieldCheck,
} from "../ui/Icons";

const Sidebar = ({
  collapsed = false,
  onToggleCollapse,
  mobileOpen = false,
  onCloseMobile,
}) => {
  const location = useLocation();

  const isDashboardActive =
    location.pathname === "/" || location.pathname === "/dashboard";
  const isCreateActive = location.pathname === "/create";
  const isProgressActive = location.pathname.startsWith("/progress");
  const isHistoryActive = location.pathname.startsWith("/interview/history");
  const isResumeActive = location.pathname.startsWith("/resume");
  const isProfileActive = location.pathname.startsWith("/profile");
  const isSettingsActive = location.pathname.startsWith("/settings");

  const handleLinkClick = () => {
    if (mobileOpen && onCloseMobile) {
      onCloseMobile();
    }
  };

  return (
    <aside
      className={`saas-sidebar ${collapsed ? "saas-sidebar--collapsed" : ""} ${
        mobileOpen ? "saas-sidebar--mobile-open" : ""
      }`}
    >
      {/* Sidebar Header */}
      <div className="sidebar-header">
        <Link to="/dashboard" className="brand-link" onClick={handleLinkClick}>
          <Logo size={26} />
          <span className="brand-title">HirePilot</span>
          <span className="brand-badge">AI</span>
        </Link>
        <button
          type="button"
          className="mobile-close-btn"
          onClick={onCloseMobile}
          aria-label="Close menu"
        >
          <X size={20} />
        </button>
      </div>

      {/* Navigation Section */}
      <nav className="sidebar-nav">
        <span className="nav-section-title">Preparation</span>

        {/* 1. Dashboard */}
        <NavLink
          to="/dashboard"
          className={`nav-item ${isDashboardActive ? "nav-item--active" : ""}`}
          onClick={handleLinkClick}
          title="Candidate Dashboard"
        >
          <span className="nav-icon">
            <LayoutDashboard size={18} />
          </span>
          <span className="nav-label">Dashboard</span>
        </NavLink>

        {/* 2. Create Custom Plan */}
        <NavLink
          to="/create"
          className={`nav-item ${isCreateActive ? "nav-item--active" : ""}`}
          onClick={handleLinkClick}
          title="Create Custom Interview Plan"
        >
          <span className="nav-icon">
            <Sparkles size={18} />
          </span>
          <span className="nav-label">Create Custom Plan</span>
          <span className="nav-badge">Core</span>
        </NavLink>

        {/* 3. Progress Analytics */}
        <NavLink
          to="/progress"
          className={`nav-item ${isProgressActive ? "nav-item--active" : ""}`}
          onClick={handleLinkClick}
          title="Preparation Analytics & Readiness"
        >
          <span className="nav-icon">
            <BarChart2 size={18} />
          </span>
          <span className="nav-label">Preparation Progress</span>
        </NavLink>

        <div className="nav-divider" />
        <span className="nav-section-title">
          Career Assets
        </span>

        {/* 4. Interview History */}
        <NavLink
          to="/interview/history"
          className={`nav-item ${isHistoryActive ? "nav-item--active" : ""}`}
          onClick={handleLinkClick}
          title="Interview Strategy History"
        >
          <span className="nav-icon">
            <FileText size={18} />
          </span>
          <span className="nav-label">Interview History</span>
        </NavLink>

        {/* 5. Resume Manager */}
        <NavLink
          to="/resume"
          className={`nav-item ${isResumeActive ? "nav-item--active" : ""}`}
          onClick={handleLinkClick}
          title="Resume Management & ATS Download"
        >
          <span className="nav-icon">
            <FileCheck size={18} />
          </span>
          <span className="nav-label">Resume Manager</span>
        </NavLink>

        {/* 6. Candidate Profile */}
        <NavLink
          to="/profile"
          className={`nav-item ${isProfileActive ? "nav-item--active" : ""}`}
          onClick={handleLinkClick}
          title="Candidate Profile & Experience"
        >
          <span className="nav-icon">
            <User size={18} />
          </span>
          <span className="nav-label">Candidate Profile</span>
        </NavLink>

        {/* 7. Settings */}
        <NavLink
          to="/settings"
          className={`nav-item ${isSettingsActive ? "nav-item--active" : ""}`}
          onClick={handleLinkClick}
          title="Platform Settings & Preferences"
        >
          <span className="nav-icon">
            <Settings size={18} />
          </span>
          <span className="nav-label">Settings</span>
        </NavLink>
      </nav>


      {/* Sidebar Footer */}
      <div className="sidebar-footer">
        <div className="plan-card">
          <div className="plan-header">
            <span className="plan-title">
              <ShieldCheck size={14} />
              AI Pilot Model
            </span>
            <span className="plan-tag">Pro</span>
          </div>
          <span className="plan-desc">
            Gemini 3 Flash • Unlimited structured interview plans
          </span>
        </div>

        <button
          type="button"
          className="collapse-btn"
          onClick={onToggleCollapse}
          title={collapsed ? "Expand sidebar" : "Collapse sidebar"}
        >
          {collapsed ? <ChevronRight size={16} /> : <ChevronLeft size={16} />}
          <span className="collapse-btn__text">Collapse sidebar</span>
        </button>
      </div>
    </aside>
  );
};

export default Sidebar;
