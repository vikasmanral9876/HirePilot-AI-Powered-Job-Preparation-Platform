/**
 * Utility for staged resume handling.
 * 
 * SECURITY & PRIVACY POLICY:
 * Staged resumes must NEVER be persisted in shared, persistent browser storage (like global IndexedDB),
 * which caused resumes to survive page refreshes and leak across different users on the same machine.
 * 
 * Resumes exist strictly in component / memory state during the active plan creation flow and are reset on:
 * 1. Page refresh (user reloads page)
 * 2. Successful plan generation
 * 3. User login / registration
 * 4. User logout
 */

const DB_NAME = "hirepilot_resume_db";

// Immediately delete any legacy persistent IndexedDB database to eliminate stale cross-user files
if (typeof window !== "undefined" && window.indexedDB) {
  try {
    window.indexedDB.deleteDatabase(DB_NAME);
  } catch (e) {
    // ignore
  }
}

/**
 * Save staged resume - no-op to prevent cross-user and cross-refresh persistence.
 */
export async function saveStagedResume(_file) {
  // Deliberately no-op: files must not be written to persistent browser disks
  return;
}

/**
 * Retrieve staged resume - always returns null so page refreshes and new sessions start fresh.
 * @returns {Promise<null>}
 */
export async function getStagedResume() {
  return null;
}

/**
 * Explicitly clear any staged resume and wipe any legacy persistent database.
 */
export async function clearStagedResume() {
  if (typeof window !== "undefined" && window.indexedDB) {
    try {
      window.indexedDB.deleteDatabase(DB_NAME);
    } catch (e) {
      // ignore
    }
  }
}
