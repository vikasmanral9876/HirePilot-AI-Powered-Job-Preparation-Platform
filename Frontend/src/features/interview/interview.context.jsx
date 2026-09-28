import { createContext, useState, useContext, useEffect, useRef } from "react";
import { AuthContext } from "../auth/auth.context";
import { clearStagedResume } from "./services/resumeStorage";

export const InterviewContext = createContext();

export const InterviewProvider = ({ children }) => {
  const auth = useContext(AuthContext);
  const user = auth?.user;
  const currentUserId = user?.id || user?._id || user?.email || null;
  const prevUserIdRef = useRef(currentUserId);

  const [loading, setLoading] = useState(false);
  const [report, setReport] = useState(null);
  const [reports, setReports] = useState([]);
  const [pagination, setPagination] = useState({ page: 1, limit: 10, total: 0, totalPages: 1 });
  const [stagedResumeFile, setStagedResumeFile] = useState(null);

  // Whenever user identity changes (login, logout, switch user, or new session),
  // purge all previous in-memory resume and report state to prevent cross-account contamination.
  useEffect(() => {
    if (prevUserIdRef.current !== currentUserId) {
      prevUserIdRef.current = currentUserId;
      setStagedResumeFile(null);
      setReport(null);
      setReports([]);
      setPagination({ page: 1, limit: 10, total: 0, totalPages: 1 });
      clearStagedResume();
    }
  }, [currentUserId]);

  return (
    <InterviewContext.Provider
      value={{
        loading,
        setLoading,
        report,
        setReport,
        reports,
        setReports,
        pagination,
        setPagination,
        stagedResumeFile,
        setStagedResumeFile,
      }}
    >
      {children}
    </InterviewContext.Provider>
  );
};
