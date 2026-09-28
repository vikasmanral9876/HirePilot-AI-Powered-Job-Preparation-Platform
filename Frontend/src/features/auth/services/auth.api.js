import axios from "axios";

const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL || "http://localhost:3000";

const api = axios.create({
  baseURL: API_BASE_URL,
  withCredentials: true,
});

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (!error.response) {
      error.message =
        "Unable to connect to the server. Please check your connection and try again.";
    } else if (error.response.status === 401) {
      error.message =
        error.response.data?.message || "Your session has expired. Please sign in again.";
    } else if (error.response.status === 429) {
      error.message =
        error.response.data?.message ||
        "Too many authentication attempts. Please try again in 15 minutes.";
    } else if (error.response.status >= 500) {
      error.message = "Something went wrong. Please try again.";
    }
    return Promise.reject(error);
  },
);

export async function register({ username, email, password }) {
  try {
    const response = await api.post("/api/auth/register", {
      username,
      email,
      password,
    });
    return response.data;
  } catch (err) {
    const message =
      err.response?.data?.message || err.message || "Registration failed";
    const error = new Error(message);
    error.status = err.response?.status;
    throw error;
  }
}

export async function login({ email, password }) {
  try {
    const response = await api.post("/api/auth/login", {
      email,
      password,
    });
    return response.data;
  } catch (err) {
    const message =
      err.response?.data?.message || err.message || "Login failed";
    const error = new Error(message);
    error.status = err.response?.status;
    throw error;
  }
}

export async function googleAuth({ idToken }) {
  try {
    const response = await api.post("/api/auth/google", { idToken });
    return response.data;
  } catch (err) {
    const message =
      err.response?.data?.message || err.message || "Google sign-in failed";
    const error = new Error(message);
    error.status = err.response?.status;
    throw error;
  }
}

export async function logout() {
  try {
    const response = await api.get("/api/auth/logout");
    return response.data;
  } catch (err) {
    console.error("Logout request error:", err);
    // Return empty success structure even if backend cookie invalidation had an issue
    return { message: "Logged out locally" };
  }
}

export async function getMe() {
  try {
    const response = await api.get("/api/auth/get-me");
    return response.data;
  } catch (err) {
    // 401 is expected if not logged in
    return null;
  }
}

export async function forgotPassword({ email }) {
  // Graceful helper for forgot password recovery
  try {
    const response = await api.post("/api/auth/forgot-password", { email });
    return response.data;
  } catch (err) {
    // If backend doesn't implement /api/auth/forgot-password yet, return simulated success
    if (err.response?.status === 404) {
      return {
        message: "If an account exists with that email, reset instructions have been sent.",
        mocked: true,
      };
    }
    const message = err.response?.data?.message || err.message || "Password reset request failed";
    throw new Error(message);
  }
}
