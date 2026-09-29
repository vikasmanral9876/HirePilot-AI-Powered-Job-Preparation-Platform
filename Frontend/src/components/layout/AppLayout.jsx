import { useState } from "react";
import { Outlet } from "react-router";
import Sidebar from "./Sidebar";
import Navbar from "./Navbar";
import "./layout.scss";

const AppLayout = () => {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [isMobileOpen, setIsMobileOpen] = useState(false);

  return (
    <div className="saas-shell">
      {/* Mobile Backdrop */}
      <div
        className={`saas-backdrop ${isMobileOpen ? "saas-backdrop--open" : ""}`}
        onClick={() => setIsMobileOpen(false)}
        aria-hidden="true"
      />

      {/* Persistent / Collapsible Sidebar */}
      <Sidebar
        collapsed={isCollapsed}
        onToggleCollapse={() => setIsCollapsed((prev) => !prev)}
        mobileOpen={isMobileOpen}
        onCloseMobile={() => setIsMobileOpen(false)}
      />

      {/* Main SaaS App Container */}
      <div className="saas-main">
        <Navbar onOpenMobile={() => setIsMobileOpen(true)} />
        <main className="saas-content">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default AppLayout;
