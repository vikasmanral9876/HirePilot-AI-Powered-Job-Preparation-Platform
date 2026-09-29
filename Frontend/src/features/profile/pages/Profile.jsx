import { useState, useEffect } from "react";
import { Link } from "react-router";
import { useAuth } from "../../auth/hooks/useAuth";
import { useInterview } from "../../interview/hooks/useInterview";
import { useCandidateProfile } from "../hooks/useCandidateProfile";
import "../profile.scss";
import {
  User as UserIcon,
  Mail,
  Briefcase,
  GraduationCap,
  Sparkles,
  Edit3,
  FileCheck,
  Plus,
  CheckCircle2,
  X,
  MapPin,
  Globe,
  Save,
  ExternalLink,
  ShieldCheck,
} from "../../../components/ui/Icons";

const Profile = () => {
  const { user } = useAuth();
  const { reports, getReports } = useInterview();
  const {
    profile,
    updateProfileFields,
    addSkill,
    removeSkill,
    addExperience,
    deleteExperience,
    addEducation,
    deleteEducation,
  } = useCandidateProfile();

  // Load real interview reports to check resume status
  useEffect(() => {
    getReports();
  }, []);

  const [isEditProfileOpen, setIsEditProfileOpen] = useState(false);
  const [isAddExpOpen, setIsAddExpOpen] = useState(false);
  const [isAddEduOpen, setIsAddEduOpen] = useState(false);
  const [newSkillInput, setNewSkillInput] = useState("");
  const [toastMessage, setToastMessage] = useState("");

  // Edit form state
  const [editForm, setEditForm] = useState({
    title: "",
    bio: "",
    location: "",
    website: "",
  });

  // Experience form state
  const [expForm, setExpForm] = useState({
    role: "",
    company: "",
    period: "",
    location: "",
    description: "",
  });

  // Education form state
  const [eduForm, setEduForm] = useState({
    degree: "",
    institution: "",
    period: "",
    description: "",
  });

  const showToast = (msg) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage("");
    }, 3500);
  };

  const openEditModal = () => {
    setEditForm({
      title: profile.title || "",
      bio: profile.bio || "",
      location: profile.location || "",
      website: profile.website || "",
    });
    setIsEditProfileOpen(true);
  };

  const handleSaveProfile = (e) => {
    e.preventDefault();
    updateProfileFields(editForm);
    setIsEditProfileOpen(false);
    showToast("Profile details saved successfully");
  };

  const handleAddSkill = (e) => {
    e.preventDefault();
    if (!newSkillInput.trim()) return;
    addSkill(newSkillInput.trim());
    setNewSkillInput("");
    showToast(`Skill "${newSkillInput.trim()}" added`);
  };

  const handleRemoveSkill = (skill) => {
    removeSkill(skill);
    showToast(`Skill "${skill}" removed`);
  };

  const handleSaveExp = (e) => {
    e.preventDefault();
    if (!expForm.role || !expForm.company) return;
    addExperience(expForm);
    setExpForm({ role: "", company: "", period: "", location: "", description: "" });
    setIsAddExpOpen(false);
    showToast("Work experience added");
  };

  const handleDeleteExp = (id) => {
    deleteExperience(id);
    showToast("Experience entry deleted");
  };

  const handleSaveEdu = (e) => {
    e.preventDefault();
    if (!eduForm.degree || !eduForm.institution) return;
    addEducation(eduForm);
    setEduForm({ degree: "", institution: "", period: "", description: "" });
    setIsAddEduOpen(false);
    showToast("Education entry added");
  };

  const handleDeleteEdu = (id) => {
    deleteEducation(id);
    showToast("Education entry deleted");
  };

  // Compute initials
  const displayName = user?.username || "Candidate";
  const displayEmail = user?.email || "candidate@hirepilot.ai";
  const getInitials = (name) => {
    if (!name) return "C";
    const parts = name.trim().split(" ");
    if (parts.length >= 2) return (parts[0][0] + parts[1][0]).toUpperCase();
    return name.substring(0, 2).toUpperCase();
  };

  // Resume status derived from real reports
  const activeReport = reports && reports.length > 0 ? reports[0] : null;
  const hasResume = Boolean(activeReport);

  return (
    <div className="profile-page">
      {/* Toast feedback */}
      {toastMessage && (
        <div className="profile-toast">
          <CheckCircle2 size={16} />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Hero Card */}
      <section className="profile-hero">
        <div className="profile-hero__banner" />
        <div className="profile-hero__content">
          <div className="profile-hero__main">
            <div className="profile-hero__avatar-wrapper">
              <div className="profile-hero__avatar">
                {profile.avatarUrl ? (
                  <img src={profile.avatarUrl} alt={displayName} />
                ) : (
                  getInitials(displayName)
                )}
              </div>
              <div className="profile-hero__avatar-badge" />
            </div>

            <div className="profile-hero__info">
              <div className="profile-hero__name-row">
                <h1 className="profile-hero__name">{displayName}</h1>
                <span className="profile-hero__badge">
                  <ShieldCheck size={12} />
                  AI Verified Candidate
                </span>
              </div>
              <p className="profile-hero__title" style={{ opacity: profile.title ? 1 : 0.65 }}>
                {profile.title || "Target Role Not Specified"}
              </p>
              <div className="profile-hero__meta">
                <span>
                  <Mail size={14} />
                  {displayEmail}
                </span>
                {profile.location && (
                  <span>
                    <MapPin size={14} />
                    {profile.location}
                  </span>
                )}
                {profile.website && (
                  <span>
                    <Globe size={14} />
                    <a
                      href={profile.website}
                      target="_blank"
                      rel="noreferrer"
                      style={{ color: "inherit", textDecoration: "none" }}
                    >
                      {profile.website.replace(/^https?:\/\//, "")}
                    </a>
                  </span>
                )}
              </div>
            </div>
          </div>

          <div className="profile-hero__actions">
            <button
              type="button"
              className="btn-secondary"
              onClick={openEditModal}
              title="Edit Candidate Profile"
            >
              <Edit3 size={15} />
              <span>Edit Profile</span>
            </button>
          </div>
        </div>
      </section>

      {/* Two Column Layout */}
      <div className="profile-grid">
        {/* Left Column: Bio, Skills & Resume Status */}
        <div className="profile-grid__sidebar" style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
          {/* About Me Card */}
          <div className="profile-card">
            <div className="profile-card__header">
              <h2>
                <UserIcon size={16} />
                <span>Professional Summary</span>
              </h2>
            </div>
            <p style={{ fontSize: "13px", lineHeight: "1.6", color: "rgba(255, 255, 255, 0.75)", margin: 0 }}>
              {profile.bio || "No summary provided. Click 'Edit Profile' to add a professional bio."}
            </p>
          </div>

          {/* Resume Status Card */}
          <div className="profile-card resume-status-card">
            <div className="profile-card__header">
              <h2>
                <FileCheck size={16} />
                <span>Resume Status</span>
              </h2>
              <Link to="/resume" className="profile-card__action-btn">
                <span>Manager</span>
                <ExternalLink size={12} />
              </Link>
            </div>

            {hasResume ? (
              <>
                <div className="resume-status-card__status-pill resume-status-card__status-pill--active">
                  <CheckCircle2 size={14} />
                  <span>Analyzed Resume On File</span>
                </div>
                <div className="resume-status-card__details">
                  <div className="resume-status-card__metric-row">
                    <span className="label">Target Role</span>
                    <span className="value">{activeReport.title || "Custom Role"}</span>
                  </div>
                  <div className="resume-status-card__metric-row">
                    <span className="label">Match Score</span>
                    <span className="value" style={{ color: "#ff2d78" }}>
                      {activeReport.matchScore ? `${activeReport.matchScore}%` : "Processed"}
                    </span>
                  </div>
                  <div className="resume-status-card__metric-row">
                    <span className="label">Last Parsed</span>
                    <span className="value">
                      {new Date(activeReport.createdAt).toLocaleDateString(undefined, {
                        month: "short",
                        day: "numeric",
                        year: "numeric",
                      })}
                    </span>
                  </div>
                </div>
                <Link to="/resume" className="resume-status-card__link">
                  <FileCheck size={14} />
                  <span>View & Download ATS Resume</span>
                </Link>
              </>
            ) : (
              <>
                <div className="resume-status-card__status-pill resume-status-card__status-pill--none">
                  <span>No Resume Uploaded</span>
                </div>
                <p style={{ fontSize: "12px", color: "#6b7280", margin: "0 0 16px 0", lineHeight: "1.5" }}>
                  Upload your PDF resume to generate tailored interview questions, skill gap analyses, and ATS-optimized downloads.
                </p>
                <Link to="/resume" className="resume-status-card__link">
                  <Plus size={14} />
                  <span>Upload Resume Now</span>
                </Link>
              </>
            )}
          </div>

          {/* Skills Card */}
          <div className="profile-card">
            <div className="profile-card__header">
              <h2>
                <Sparkles size={16} />
                <span>Verified Skills</span>
              </h2>
              <span style={{ fontSize: "11px", color: "#6b7280" }}>
                {profile.skills.length} skills
              </span>
            </div>

            <div className="skills-container">
              <div className="skills-container__tags">
                {(!profile.skills || profile.skills.length === 0) ? (
                  <p style={{ fontSize: "12px", color: "#6b7280", fontStyle: "italic", margin: "4px 0" }}>
                    No skills added yet. Add your key technical and professional skills below.
                  </p>
                ) : (
                  profile.skills.map((skill) => (
                    <span key={skill} className="skills-container__tag">
                      <span>{skill}</span>
                      <button
                        type="button"
                        className="remove-btn"
                        onClick={() => handleRemoveSkill(skill)}
                        title={`Remove ${skill}`}
                      >
                        <X size={12} />
                      </button>
                    </span>
                  ))
                )}
              </div>

              <form className="skills-container__add-form" onSubmit={handleAddSkill}>
                <input
                  type="text"
                  placeholder="Add skill (e.g. Next.js)..."
                  value={newSkillInput}
                  onChange={(e) => setNewSkillInput(e.target.value)}
                />
                <button type="submit">
                  <Plus size={14} />
                  <span>Add</span>
                </button>
              </form>
            </div>
          </div>
        </div>

        {/* Right Column: Work Experience & Education */}
        <div className="profile-grid__main" style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
          {/* Experience Card */}
          <div className="profile-card">
            <div className="profile-card__header">
              <h2>
                <Briefcase size={16} />
                <span>Work Experience</span>
              </h2>
              <button
                type="button"
                className="profile-card__action-btn"
                onClick={() => setIsAddExpOpen(true)}
              >
                <Plus size={13} />
                <span>Add Experience</span>
              </button>
            </div>

            {profile.experience.length === 0 ? (
              <p style={{ fontSize: "13px", color: "#6b7280", fontStyle: "italic", margin: 0 }}>
                No work experience added yet. Click &apos;Add Experience&apos; to showcase your career timeline.
              </p>
            ) : (
              <div className="timeline-list">
                {profile.experience.map((exp) => (
                  <div key={exp.id} className="timeline-item">
                    <div className="timeline-item__header">
                      <div>
                        <div className="timeline-item__role">{exp.role}</div>
                        <div className="timeline-item__company">{exp.company}</div>
                      </div>
                      <span className="timeline-item__period">{exp.period}</span>
                    </div>
                    {exp.location && (
                      <div className="timeline-item__location">{exp.location}</div>
                    )}
                    <p className="timeline-item__desc">{exp.description}</p>
                    <div className="timeline-item__actions">
                      <button
                        type="button"
                        className="delete-btn"
                        onClick={() => handleDeleteExp(exp.id)}
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Education Card */}
          <div className="profile-card">
            <div className="profile-card__header">
              <h2>
                <GraduationCap size={16} />
                <span>Education & Credentials</span>
              </h2>
              <button
                type="button"
                className="profile-card__action-btn"
                onClick={() => setIsAddEduOpen(true)}
              >
                <Plus size={13} />
                <span>Add Education</span>
              </button>
            </div>

            {profile.education.length === 0 ? (
              <p style={{ fontSize: "13px", color: "#6b7280", fontStyle: "italic", margin: 0 }}>
                No education details listed yet. Click &apos;Add Education&apos; to add degrees or certifications.
              </p>
            ) : (
              <div className="timeline-list">
                {profile.education.map((edu) => (
                  <div key={edu.id} className="timeline-item">
                    <div className="timeline-item__header">
                      <div>
                        <div className="timeline-item__role">{edu.degree}</div>
                        <div className="timeline-item__company">{edu.institution}</div>
                      </div>
                      <span className="timeline-item__period">{edu.period}</span>
                    </div>
                    <p className="timeline-item__desc">{edu.description}</p>
                    <div className="timeline-item__actions">
                      <button
                        type="button"
                        className="delete-btn"
                        onClick={() => handleDeleteEdu(edu.id)}
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* EDIT PROFILE MODAL */}
      {isEditProfileOpen && (
        <div className="modal-overlay" onClick={() => setIsEditProfileOpen(false)}>
          <div className="edit-modal" onClick={(e) => e.stopPropagation()}>
            <div className="edit-modal__header">
              <h2>Edit Candidate Profile</h2>
              <button
                type="button"
                onClick={() => setIsEditProfileOpen(false)}
                aria-label="Close modal"
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleSaveProfile}>
              <div className="edit-modal__body">
                <div className="form-group">
                  <label htmlFor="title">Professional Title</label>
                  <input
                    id="title"
                    type="text"
                    placeholder="e.g. Lead Software Architect"
                    value={editForm.title}
                    onChange={(e) =>
                      setEditForm((prev) => ({ ...prev, title: e.target.value }))
                    }
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="location">Location / Work Mode</label>
                  <input
                    id="location"
                    type="text"
                    placeholder="e.g. San Francisco, CA (Remote)"
                    value={editForm.location}
                    onChange={(e) =>
                      setEditForm((prev) => ({ ...prev, location: e.target.value }))
                    }
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="website">Portfolio / GitHub / LinkedIn</label>
                  <input
                    id="website"
                    type="text"
                    placeholder="e.g. https://github.com/myusername"
                    value={editForm.website}
                    onChange={(e) =>
                      setEditForm((prev) => ({ ...prev, website: e.target.value }))
                    }
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="bio">Professional Summary / Bio</label>
                  <textarea
                    id="bio"
                    placeholder="Summarize your technical background, domain focus, and key impact..."
                    rows={4}
                    value={editForm.bio}
                    onChange={(e) =>
                      setEditForm((prev) => ({ ...prev, bio: e.target.value }))
                    }
                  />
                </div>
              </div>

              <div className="edit-modal__footer">
                <button
                  type="button"
                  className="btn-secondary"
                  onClick={() => setIsEditProfileOpen(false)}
                >
                  Cancel
                </button>
                <button type="submit" className="btn-primary">
                  <Save size={14} />
                  <span>Save Changes</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ADD EXPERIENCE MODAL */}
      {isAddExpOpen && (
        <div className="modal-overlay" onClick={() => setIsAddExpOpen(false)}>
          <div className="edit-modal" onClick={(e) => e.stopPropagation()}>
            <div className="edit-modal__header">
              <h2>Add Work Experience</h2>
              <button
                type="button"
                onClick={() => setIsAddExpOpen(false)}
                aria-label="Close modal"
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleSaveExp}>
              <div className="edit-modal__body">
                <div className="form-group">
                  <label htmlFor="role">Job Title / Role *</label>
                  <input
                    id="role"
                    type="text"
                    required
                    placeholder="e.g. Senior Frontend Engineer"
                    value={expForm.role}
                    onChange={(e) =>
                      setExpForm((prev) => ({ ...prev, role: e.target.value }))
                    }
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="company">Company *</label>
                  <input
                    id="company"
                    type="text"
                    required
                    placeholder="e.g. Acme Cloud Systems"
                    value={expForm.company}
                    onChange={(e) =>
                      setExpForm((prev) => ({ ...prev, company: e.target.value }))
                    }
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="period">Duration / Period</label>
                  <input
                    id="period"
                    type="text"
                    placeholder="e.g. 2022 - Present"
                    value={expForm.period}
                    onChange={(e) =>
                      setExpForm((prev) => ({ ...prev, period: e.target.value }))
                    }
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="exp-location">Location</label>
                  <input
                    id="exp-location"
                    type="text"
                    placeholder="e.g. New York, NY (Hybrid)"
                    value={expForm.location}
                    onChange={(e) =>
                      setExpForm((prev) => ({ ...prev, location: e.target.value }))
                    }
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="exp-desc">Key Achievements & Responsibilities</label>
                  <textarea
                    id="exp-desc"
                    placeholder="Describe your contributions, tools used, and business outcomes..."
                    rows={3}
                    value={expForm.description}
                    onChange={(e) =>
                      setExpForm((prev) => ({ ...prev, description: e.target.value }))
                    }
                  />
                </div>
              </div>

              <div className="edit-modal__footer">
                <button
                  type="button"
                  className="btn-secondary"
                  onClick={() => setIsAddExpOpen(false)}
                >
                  Cancel
                </button>
                <button type="submit" className="btn-primary">
                  <Plus size={14} />
                  <span>Add Experience</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ADD EDUCATION MODAL */}
      {isAddEduOpen && (
        <div className="modal-overlay" onClick={() => setIsAddEduOpen(false)}>
          <div className="edit-modal" onClick={(e) => e.stopPropagation()}>
            <div className="edit-modal__header">
              <h2>Add Education or Certification</h2>
              <button
                type="button"
                onClick={() => setIsAddEduOpen(false)}
                aria-label="Close modal"
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleSaveEdu}>
              <div className="edit-modal__body">
                <div className="form-group">
                  <label htmlFor="degree">Degree / Certificate *</label>
                  <input
                    id="degree"
                    type="text"
                    required
                    placeholder="e.g. B.S. in Computer Science"
                    value={eduForm.degree}
                    onChange={(e) =>
                      setEduForm((prev) => ({ ...prev, degree: e.target.value }))
                    }
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="institution">Institution / University *</label>
                  <input
                    id="institution"
                    type="text"
                    required
                    placeholder="e.g. University of California, Berkeley"
                    value={eduForm.institution}
                    onChange={(e) =>
                      setEduForm((prev) => ({ ...prev, institution: e.target.value }))
                    }
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="edu-period">Graduation Year / Period</label>
                  <input
                    id="edu-period"
                    type="text"
                    placeholder="e.g. 2018 - 2022"
                    value={eduForm.period}
                    onChange={(e) =>
                      setEduForm((prev) => ({ ...prev, period: e.target.value }))
                    }
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="edu-desc">Honors & Field of Study</label>
                  <textarea
                    id="edu-desc"
                    placeholder="Relevant coursework, honors, GPA or thesis topics..."
                    rows={3}
                    value={eduForm.description}
                    onChange={(e) =>
                      setEduForm((prev) => ({ ...prev, description: e.target.value }))
                    }
                  />
                </div>
              </div>

              <div className="edit-modal__footer">
                <button
                  type="button"
                  className="btn-secondary"
                  onClick={() => setIsAddEduOpen(false)}
                >
                  Cancel
                </button>
                <button type="submit" className="btn-primary">
                  <Plus size={14} />
                  <span>Add Education</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Profile;
