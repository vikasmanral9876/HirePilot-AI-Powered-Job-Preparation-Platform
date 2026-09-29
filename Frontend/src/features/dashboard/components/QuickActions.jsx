import { Link } from "react-router";
import {
  Sparkles,
  Download,
  CheckSquare,
  Target,
} from "../../../components/ui/Icons";

const QuickActions = ({ latestReportId, onDownloadResume }) => {
  return (
    <div className="dash-card">
      <div className="dash-card__header">
        <div className="header-title-group">
          <h2>Quick Actions</h2>
        </div>
      </div>

      <div className="dash-card__body">
        <div className="quick-actions-grid">
          {/* Action 1 */}
          <Link to="/create" className="action-card">
            <div className="action-card__icon">
              <Sparkles size={18} />
            </div>
            <div className="action-card__text">
              <h3 className="title">New Interview Strategy</h3>
              <p className="desc">Analyze JD & resume in ~30s</p>
            </div>
          </Link>

          {/* Action 2 */}
          {latestReportId ? (
            <div
              className="action-card"
              onClick={() => onDownloadResume(latestReportId)}
            >
              <div className="action-card__icon">
                <Download size={18} />
              </div>
              <div className="action-card__text">
                <h3 className="title">Download ATS Resume</h3>
                <p className="desc">Get tailored PDF for latest role</p>
              </div>
            </div>
          ) : (
            <Link to="/create" className="action-card">
              <div className="action-card__icon">
                <Download size={18} />
              </div>
              <div className="action-card__text">
                <h3 className="title">Tailored ATS Resume</h3>
                <p className="desc">Create a plan to unlock resume</p>
              </div>
            </Link>
          )}

          {/* Action 3 */}
          {latestReportId ? (
            <Link to={`/interview/${latestReportId}`} className="action-card">
              <div className="action-card__icon">
                <CheckSquare size={18} />
              </div>
              <div className="action-card__text">
                <h3 className="title">Practice Questions</h3>
                <p className="desc">Review model answers & intent</p>
              </div>
            </Link>
          ) : (
            <Link to="/create" className="action-card">
              <div className="action-card__icon">
                <CheckSquare size={18} />
              </div>
              <div className="action-card__text">
                <h3 className="title">Practice Questions</h3>
                <p className="desc">Targeted Q&A generation</p>
              </div>
            </Link>
          )}

          {/* Action 4 */}
          {latestReportId ? (
            <Link to={`/interview/${latestReportId}`} className="action-card">
              <div className="action-card__icon">
                <Target size={18} />
              </div>
              <div className="action-card__text">
                <h3 className="title">Review Skill Gaps</h3>
                <p className="desc">High & mid priority focus areas</p>
              </div>
            </Link>
          ) : (
            <Link to="/create" className="action-card">
              <div className="action-card__icon">
                <Target size={18} />
              </div>
              <div className="action-card__text">
                <h3 className="title">Skill Gap Analysis</h3>
                <p className="desc">Detect candidate skill shortages</p>
              </div>
            </Link>
          )}
        </div>
      </div>
    </div>
  );
};

export default QuickActions;
