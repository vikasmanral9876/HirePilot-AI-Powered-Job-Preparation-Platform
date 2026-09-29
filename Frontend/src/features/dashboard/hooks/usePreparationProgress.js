import { useState, useEffect, useCallback } from "react";
import { useAuth } from "../../auth/hooks/useAuth";

/**
 * Data adapter hook for tracking interview preparation progress and roadmap task completions.
 * Strictly scopes checklist progress and activity logs to the authenticated user ID
 * so a new user never inherits any other user's milestones or tasks.
 */
export const usePreparationProgress = (activeReport) => {
  const { user } = useAuth();
  const userId = user?.id || user?._id || user?.email || "anonymous";
  const reportId = activeReport?._id;
  const storageKey = reportId
    ? `hirepilot_prep_${userId}_${reportId}`
    : null;
  const activityKey = `hirepilot_activity_log_${userId}`;

  const [completedTasks, setCompletedTasks] = useState(() => {
    if (!storageKey) return [];

    try {
      const stored = localStorage.getItem(storageKey);
      return stored ? JSON.parse(stored) : [];
    } catch (e) {
      console.error("Failed to load preparation progress:", e);
      return [];
    }
  });

  const [activityLog, setActivityLog] = useState(() => {
    try {
      const storedActivities = localStorage.getItem(activityKey);

      if (!storedActivities) return [];

      const parsed = JSON.parse(storedActivities);

      if (!Array.isArray(parsed)) return [];

      // Deduplicate by taskId or message so any past duplicated entries are cleaned up
      const seen = new Set();
      const cleanActivities = [];

      for (const item of parsed) {
        const key = item.taskId
          ? `task_${item.taskId}`
          : item.message;

        if (key && !seen.has(key)) {
          seen.add(key);
          cleanActivities.push(item);
        }
      }

      // Persist the cleaned version
      localStorage.setItem(
        activityKey,
        JSON.stringify(cleanActivities)
      );

      return cleanActivities;
    } catch (e) {
      console.error("Failed to load activity log:", e);
      return [];
    }
  });

  // Clean up any legacy un-scoped activity log to prevent data cross-contamination
  useEffect(() => {
    try {
      localStorage.removeItem("hirepilot_activity_log");
    } catch {
      // Safe storage cleanup
    }
  }, []);

  // Reload completed tasks when the active report changes
  useEffect(() => {
    if (!storageKey) return;

    try {
      const stored = localStorage.getItem(storageKey);
      const tasks = stored ? JSON.parse(stored) : [];

      setCompletedTasks(Array.isArray(tasks) ? tasks : []);
    } catch (e) {
      console.error("Failed to reload preparation progress:", e);
      setCompletedTasks([]);
    }
  }, [storageKey]);

  // Reload activity log when the authenticated user changes
  useEffect(() => {
    try {
      const storedActivities = localStorage.getItem(activityKey);

      if (!storedActivities) {
        setActivityLog([]);
        return;
      }

      const parsed = JSON.parse(storedActivities);

      if (!Array.isArray(parsed)) {
        setActivityLog([]);
        return;
      }

      const seen = new Set();
      const cleanActivities = [];

      for (const item of parsed) {
        const key = item.taskId
          ? `task_${item.taskId}`
          : item.message;

        if (key && !seen.has(key)) {
          seen.add(key);
          cleanActivities.push(item);
        }
      }

      setActivityLog(cleanActivities);

      localStorage.setItem(
        activityKey,
        JSON.stringify(cleanActivities)
      );
    } catch (e) {
      console.error("Failed to reload activity log:", e);
      setActivityLog([]);
    }
  }, [activityKey]);

  const addActivity = useCallback(
    (type, message, metadata = {}) => {
      const newEntry = {
        id: metadata.taskId
          ? `task_${metadata.taskId}`
          : `${Date.now()}_${Math.random().toString(36).substr(2, 4)}`,
        type,
        message,
        timestamp: new Date().toISOString(),
        ...metadata,
      };

      setActivityLog((prev) => {
        // Remove previous entry with same taskId or identical message
        const filtered = prev.filter(
          (item) =>
            (metadata.taskId
              ? item.taskId !== metadata.taskId
              : true) &&
            item.message !== message
        );

        const updated = [newEntry, ...filtered].slice(0, 20);

        try {
          localStorage.setItem(
            activityKey,
            JSON.stringify(updated)
          );
        } catch (e) {
          console.error("Failed to save activity:", e);
        }

        return updated;
      });
    },
    [activityKey]
  );

  const toggleTask = useCallback(
    (taskId, taskDescription) => {
      if (!storageKey) return;

      const isCompleted = completedTasks.includes(taskId);

      const updated = isCompleted
        ? completedTasks.filter((id) => id !== taskId)
        : [...completedTasks, taskId];

      setCompletedTasks(updated);

      try {
        localStorage.setItem(
          storageKey,
          JSON.stringify(updated)
        );
      } catch (e) {
        console.error("Failed to save task status:", e);
      }

      const taskSummary = `Completed task: "${taskDescription}"`;

      if (!isCompleted) {
        // Task was completed: Add/update a single activity entry
        const newEntry = {
          id: `task_${taskId}`,
          type: "task_completed",
          taskId,
          message: taskSummary,
          timestamp: new Date().toISOString(),
          reportId,
          reportTitle: activeReport?.title,
        };

        setActivityLog((prev) => {
          const filtered = prev.filter(
            (item) =>
              item.taskId !== taskId &&
              item.message !== taskSummary
          );

          const updatedLog = [newEntry, ...filtered].slice(0, 20);

          try {
            localStorage.setItem(
              activityKey,
              JSON.stringify(updatedLog)
            );
          } catch (e) {
            console.error("Failed to save activity log:", e);
          }

          return updatedLog;
        });
      } else {
        // Task was unchecked: Remove its completion activity
        setActivityLog((prev) => {
          const updatedLog = prev.filter(
            (item) =>
              item.taskId !== taskId &&
              item.message !== taskSummary
          );

          try {
            localStorage.setItem(
              activityKey,
              JSON.stringify(updatedLog)
            );
          } catch (e) {
            console.error("Failed to save activity log:", e);
          }

          return updatedLog;
        });
      }
    },
    [
      storageKey,
      completedTasks,
      activityKey,
      reportId,
      activeReport?.title,
    ]
  );

  return {
    completedTasks,
    toggleTask,
    activityLog,
    addActivity,
  };
};