import { Navigate } from "react-router";
import { useAuth } from "../hooks/useAuth";
import { Logo, Loader2 } from "../../../components/ui/Icons";

const Protected = ({ children }) => {
  const { loading, user } = useAuth();

  if (loading) {
    return (
      <div
        style={{
          minHeight: "100vh",
          width: "100%",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          gap: "1.25rem",
          backgroundColor: "#0a0d14",
          color: "#f0f4f8",
          fontFamily: "'Plus Jakarta Sans', system-ui, sans-serif",
        }}
      >
        <div style={{ position: "relative" }}>
          <Logo size={48} />
          <div
            style={{
              position: "absolute",
              inset: "-8px",
              borderRadius: "16px",
              background: "radial-gradient(circle, rgba(255, 45, 120, 0.4) 0%, transparent 70%)",
              zIndex: -1,
            }}
          />
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: "0.6rem" }}>
          <Loader2 size={20} className="spin-icon" style={{ color: "#ff2d78" }} />
          <span style={{ fontSize: "0.95rem", color: "#94a3b8", fontWeight: 500 }}>
            Initializing HirePilot workspace...
          </span>
        </div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  return children;
};

export default Protected;
