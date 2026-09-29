import { Link, useLocation } from "react-router";
import UserDropdown from "./UserDropdown";
import { Menu, Plus } from "../ui/Icons";

const Navbar = ({ onOpenMobile }) => {
  const location = useLocation();

  // Compute friendly breadcrumbs
  const getPageInfo = () => {
    if (location.pathname === "/" || location.pathname === "/dashboard") {
      return {
        section: "HirePilot",
        current: "Dashboard Overview",
      };
    }
    if (location.pathname.startsWith("/progress")) {
      return {
        section: "Preparation",
        current: "Readiness Analytics",
      };
    }
    if (location.pathname.startsWith("/interview/history")) {
      return {
        section: "HirePilot",
        current: "Interview History",
      };
    }
    if (location.pathname.startsWith("/interview")) {
      return {
        section: "Interview Strategy",
        current: "Report & Road Map",
      };
    }
    if (location.pathname.startsWith("/resume")) {
      return {
        section: "Career Assets",
        current: "Resume Management",
      };
    }
    if (location.pathname.startsWith("/profile")) {
      return {
        section: "Candidate",
        current: "Profile & Career Assets",
      };
    }
    if (location.pathname.startsWith("/settings")) {
      return {
        section: "Preferences",
        current: "Platform Settings",
      };
    }
    return {
      section: "Interview Preparation",
      current: "Create Custom Plan",
    };
  };

  const { section, current } = getPageInfo();

  return (
    <header className="saas-navbar">
      {/* Left side */}
      <div className="saas-navbar__left">
        <button
          type="button"
          className="mobile-menu-btn"
          onClick={onOpenMobile}
          aria-label="Open mobile navigation"
        >
          <Menu size={22} />
        </button>

        <div className="breadcrumbs">
          <span className="crumb-root">{section}</span>
          <span className="crumb-separator">/</span>
          <span className="crumb-active">{current}</span>
        </div>
      </div>

      {/* Right side */}
      <div className="saas-navbar__right">
        {/* AI Status Badge */}
        <div className="engine-pill" title="Gemini 3 Flash Generation Engine Online">
          <span className="status-pulse" />
          <span>Gemini 3.0 AI</span>
        </div>

        {/* Quick Action Button */}
        <Link to="/create" className="new-plan-btn">
          <Plus size={16} />
          <span>New Plan</span>
        </Link>

        {/* User Dropdown */}
        <UserDropdown />
      </div>
    </header>
  );
};

export default Navbar;
