import { Link } from "react-router";
import { Sparkles, ArrowRight, ShieldCheck } from "../../../components/ui/Icons";

const WelcomeBanner = ({ user, plansCount = 0 }) => {
  const displayName = user?.username ? user.username.split(" ")[0] : "Candidate";

  // Check if this is the user's first login:
  // - If isFirstLogin is explicitly true, it's their first login.
  // - If isFirstLogin is false, or loginCount > 1, or they have created interview plans, they are returning.
  // - Fallback: new accounts with 0 plans and loginCount <= 1 are treated as first login.
  const isFirstTime =
    user?.isFirstLogin === true ||
    (user?.isFirstLogin !== false &&
      (user?.loginCount === undefined || user?.loginCount <= 1) &&
      plansCount === 0);

  const greetingPrefix = isFirstTime ? "Hi" : "Welcome back";

  return (
    <section className="welcome-banner">
      <div className="welcome-banner__content">
        <div className="welcome-pill">
          <ShieldCheck size={14} />
          <span>Active Preparation Workspace</span>
        </div>
        <h1>
          {greetingPrefix} <span className="highlight-name">{displayName}</span> 👋
        </h1>
        <p>
          Analyze your target roles, review tailored interview questions, and build ATS-optimized resumes backed by Gemini 3.0 intelligence.
        </p>
      </div>

      <div className="welcome-banner__actions">
        <Link to="/create" className="primary-cta-btn">
          <Sparkles size={18} />
          <span>Create Custom Interview Plan</span>
          <ArrowRight size={16} />
        </Link>
      </div>
    </section>
  );
};

export default WelcomeBanner;
