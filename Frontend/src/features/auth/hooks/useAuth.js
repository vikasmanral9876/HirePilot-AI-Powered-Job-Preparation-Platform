import { useContext, useEffect, useState, useCallback } from "react";
import { AuthContext } from "../auth.context";
import { login, register, logout, getMe, googleAuth } from "../services/auth.api";
import { clearStagedResume } from "../../interview/services/resumeStorage";

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }

  const { user, setUser, loading, setLoading } = context;
  const [authError, setAuthError] = useState(null);

  const handleLogin = useCallback(async ({ email, password }) => {
    setLoading(true);
    setAuthError(null);
    clearStagedResume();
    try {
      const data = await login({ email, password });
      if (data?.user) {
        clearStagedResume();
        setUser(data.user);
        return { success: true, user: data.user };
      }
      const err = "Login failed: No user returned";
      setAuthError(err);
      return { success: false, error: err };
    } catch (err) {
      const message = err?.message || "Invalid email or password";
      setAuthError(message);
      return { success: false, error: message };
    } finally {
      setLoading(false);
    }
  }, [setLoading, setUser]);

  const handleGoogleLogin = useCallback(async ({ idToken }) => {
    setLoading(true);
    setAuthError(null);
    clearStagedResume();
    try {
      const data = await googleAuth({ idToken });
      if (data?.user) {
        clearStagedResume();
        setUser(data.user);
        return { success: true, user: data.user };
      }
      const err = "Google sign-in failed: No user returned";
      setAuthError(err);
      return { success: false, error: err };
    } catch (err) {
      const message = err?.message || "Google sign-in failed";
      setAuthError(message);
      return { success: false, error: message };
    } finally {
      setLoading(false);
    }
  }, [setLoading, setUser]);

  const handleRegister = useCallback(async ({ username, email, password }) => {
    setLoading(true);
    setAuthError(null);
    clearStagedResume();
    try {
      const data = await register({ username, email, password });
      if (data?.user) {
        clearStagedResume();
        setUser(data.user);
        return { success: true, user: data.user };
      }
      const err = "Registration failed";
      setAuthError(err);
      return { success: false, error: err };
    } catch (err) {
      const message = err?.message || "Registration failed";
      setAuthError(message);
      return { success: false, error: message };
    } finally {
      setLoading(false);
    }
  }, [setLoading, setUser]);

  const updateUserData = useCallback((updatedFields) => {
    if (updatedFields.username && user) {
      const uId = user.id || user._id || user.email;
      try {
        localStorage.setItem(`hirepilot_custom_username_${uId}`, updatedFields.username);
      } catch (e) {
        console.error("Failed to save custom username:", e);
      }
    }
    setUser((prev) => (prev ? { ...prev, ...updatedFields } : updatedFields));
  }, [user, setUser]);

  const handleLogout = useCallback(async () => {
    setLoading(true);
    clearStagedResume();
    try {
      await logout();
      try {
        localStorage.removeItem("hirepilot_custom_username");
      } catch {
        // Safe storage cleanup
      }
      clearStagedResume();
      setUser(null);
      return { success: true };
    } catch (err) {
      console.error("Logout error:", err?.message || err);
      try {
        localStorage.removeItem("hirepilot_custom_username");
      } catch {
        // Safe storage cleanup
      }
      clearStagedResume();
      setUser(null);
      return { success: true };
    } finally {
      setLoading(false);
    }
  }, [setLoading, setUser]);

  useEffect(() => {
    let isMounted = true;
    const getAndSetUser = async () => {
      try {
        const data = await getMe();
        if (isMounted) {
          // Clean legacy un-scoped key
          localStorage.removeItem("hirepilot_custom_username");
          if (data?.user) {
            const uId = data.user.id || data.user._id || data.user.email;
            const customName = localStorage.getItem(`hirepilot_custom_username_${uId}`);
            const resolvedUser = {
              ...data.user,
              username: customName || data.user.username,
            };
            setUser(resolvedUser);
          } else {
            setUser(null);
          }
        }
      } catch {
        if (isMounted) {
          setUser(null);
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    getAndSetUser();

    return () => {
      isMounted = false;
    };
  }, [setUser, setLoading]);

  return {
    user,
    loading,
    authError,
    setAuthError,
    handleRegister,
    handleLogin,
    handleGoogleLogin,
    handleLogout,
    updateUserData,
  };
};
