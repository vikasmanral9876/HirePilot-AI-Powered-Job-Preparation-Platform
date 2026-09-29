import { lazy, Suspense } from "react";
import { createBrowserRouter, Navigate } from "react-router";
import Protected from "./features/auth/components/Protected";
import AppLayout from "./components/layout/AppLayout";

// Lazy-loaded route components for optimized bundle splitting
const Login = lazy(() => import("./features/auth/pages/Login"));
const Register = lazy(() => import("./features/auth/pages/Register"));
const ForgotPassword = lazy(() => import("./features/auth/pages/ForgotPassword"));
const Dashboard = lazy(() => import("./features/dashboard/pages/Dashboard"));
const Home = lazy(() => import("./features/interview/pages/Home"));
const Interview = lazy(() => import("./features/interview/pages/interview"));
const InterviewHistory = lazy(() => import("./features/interview/pages/InterviewHistory"));
const ResumeManager = lazy(() => import("./features/resume/pages/ResumeManager"));
const Profile = lazy(() => import("./features/profile/pages/Profile"));
const ProgressAnalytics = lazy(() => import("./features/progress/pages/ProgressAnalytics"));
const Settings = lazy(() => import("./features/settings/pages/Settings"));

const PageLoader = () => (
  <div
    style={{
      minHeight: "60vh",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      flexDirection: "column",
      gap: "1rem",
      color: "#94a3b8",
    }}
  >
    <div
      style={{
        width: "36px",
        height: "36px",
        borderRadius: "50%",
        border: "3px solid rgba(224, 36, 121, 0.2)",
        borderTopColor: "#e02479",
        animation: "hirepilot-spin 0.8s linear infinite",
      }}
    />
    <span style={{ fontSize: "0.875rem", letterSpacing: "0.02em" }}>
      Loading workspace...
    </span>
    <style>{`@keyframes hirepilot-spin { to { transform: rotate(360deg); } }`}</style>
  </div>
);

const withSuspense = (Component) => (
  <Suspense fallback={<PageLoader />}>
    <Component />
  </Suspense>
);

export const router = createBrowserRouter([
  {
    path: "/login",
    element: withSuspense(Login),
  },
  {
    path: "/register",
    element: withSuspense(Register),
  },
  {
    path: "/forgot-password",
    element: withSuspense(ForgotPassword),
  },
  {
    path: "/",
    element: (
      <Protected>
        <AppLayout />
      </Protected>
    ),
    children: [
      {
        index: true,
        element: withSuspense(Dashboard),
      },
      {
        path: "dashboard",
        element: withSuspense(Dashboard),
      },
      {
        path: "create",
        element: withSuspense(Home),
      },
      {
        path: "interview/history",
        element: withSuspense(InterviewHistory),
      },
      {
        path: "interview/:interviewId",
        element: withSuspense(Interview),
      },
      {
        path: "resume",
        element: withSuspense(ResumeManager),
      },
      {
        path: "profile",
        element: withSuspense(Profile),
      },
      {
        path: "progress",
        element: withSuspense(ProgressAnalytics),
      },
      {
        path: "settings",
        element: withSuspense(Settings),
      },
    ],
  },
  {
    path: "*",
    element: <Navigate to="/" replace />,
  },
]);