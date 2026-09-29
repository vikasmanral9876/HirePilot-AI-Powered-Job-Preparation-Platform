import { useState, useRef, useEffect } from "react";
import { Link, useNavigate } from "react-router";
import { useAuth } from "../../features/auth/hooks/useAuth";
import {
  ChevronDown,
  LayoutDashboard,
  Sparkles,
  BarChart2,
  FileText,
  FileCheck,
  User as UserIcon,
  Settings as SettingsIcon,
  LogOut,
} from "../ui/Icons";

const UserDropdown = () => {
  const { user, handleLogout } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef(null);
  const navigate = useNavigate();

  // Close dropdown on click outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };

    const handleKeyDown = (event) => {
      if (event.key === "Escape") {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
      document.addEventListener("keydown", handleKeyDown);
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [isOpen]);

  const [isLoggingOut, setIsLoggingOut] = useState(false);

  const onLogout = async () => {
    if (isLoggingOut) return;
    setIsLoggingOut(true);
    setIsOpen(false);
    try {
      await handleLogout();
    } finally {
      setIsLoggingOut(false);
      navigate("/login", { replace: true });
    }
  };

  // Get user initials
  const getInitials = (name) => {
    if (!name) return "U";
    const parts = name.trim().split(" ");
    if (parts.length >= 2) {
      return (parts[0][0] + parts[1][0]).toUpperCase();
    }
    return name.substring(0, 2).toUpperCase();
  };

  const displayName = user?.username || "Candidate";
  const displayEmail = user?.email || "candidate@hirepilot.ai";

  return (
    <div className="user-dropdown" ref={dropdownRef}>
      <button
        type="button"
        className="user-dropdown__trigger"
        onClick={() => setIsOpen((prev) => !prev)}
        aria-haspopup="true"
        aria-expanded={isOpen}
      >
        <span className="avatar">{getInitials(displayName)}</span>
        <span className="username">{displayName}</span>
        <span className={`chevron ${isOpen ? "chevron--open" : ""}`}>
          <ChevronDown size={14} />
        </span>
      </button>

      {isOpen && (
        <div className="user-dropdown__menu" role="menu">
          <div className="menu-header">
            <div className="menu-user-name">{displayName}</div>
            <div className="menu-user-email">{displayEmail}</div>
          </div>

          <Link
            to="/dashboard"
            className="menu-item"
            role="menuitem"
            onClick={() => setIsOpen(false)}
          >
            <LayoutDashboard size={16} />
            <span>Dashboard Overview</span>
          </Link>

          <Link
            to="/profile"
            className="menu-item"
            role="menuitem"
            onClick={() => setIsOpen(false)}
          >
            <UserIcon size={16} />
            <span>Candidate Profile</span>
          </Link>

          <Link
            to="/progress"
            className="menu-item"
            role="menuitem"
            onClick={() => setIsOpen(false)}
          >
            <BarChart2 size={16} />
            <span>Preparation Progress</span>
          </Link>

          <Link
            to="/create"
            className="menu-item"
            role="menuitem"
            onClick={() => setIsOpen(false)}
          >
            <Sparkles size={16} />
            <span>Create New Plan</span>
          </Link>

          <Link
            to="/interview/history"
            className="menu-item"
            role="menuitem"
            onClick={() => setIsOpen(false)}
          >
            <FileText size={16} />
            <span>Interview History</span>
          </Link>

          <Link
            to="/resume"
            className="menu-item"
            role="menuitem"
            onClick={() => setIsOpen(false)}
          >
            <FileCheck size={16} />
            <span>Resume Manager</span>
          </Link>

          <Link
            to="/settings"
            className="menu-item"
            role="menuitem"
            onClick={() => setIsOpen(false)}
          >
            <SettingsIcon size={16} />
            <span>Settings</span>
          </Link>

          <div className="menu-divider" />


          <button
            type="button"
            className="menu-item menu-item--danger"
            role="menuitem"
            onClick={onLogout}
            disabled={isLoggingOut}
          >
            <LogOut size={16} />
            <span>{isLoggingOut ? "Signing Out..." : "Sign Out"}</span>
          </button>
        </div>
      )}
    </div>
  );
};

export default UserDropdown;
