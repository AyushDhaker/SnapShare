// src/pages/Login.jsx

import React, { useState } from "react";
import { useAuth } from "../context/AuthContext";
import { useNavigate, Link } from "react-router-dom";

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      setError("");
      setLoading(true);

      await login(email, password);

      // UPDATED: Redirect to dashboard instead of the landing page ("/")
      navigate("/dashboard", { replace: true });

    } catch (err) {
      if (err.code === "auth/user-not-found") {
        setError("User not found.");
      } else if (err.code === "auth/wrong-password") {
        setError("Incorrect password.");
      } else if (err.code === "auth/invalid-credential") {
        setError("Invalid email or password.");
      } else if (err.code === "auth/invalid-email") {
        setError("Invalid email format.");
      } else {
        setError("Login failed. Please try again.");
      }
    } finally {
      setLoading(false);
    }
  };

  const styles = {
    container: {
      minHeight: "100vh",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      backgroundColor: "#121212",
      fontFamily: "sans-serif",
      padding: "20px",
    },
    card: {
      backgroundColor: "#1e1e1e",
      padding: "40px",
      borderRadius: "16px",
      width: "100%",
      maxWidth: "400px",
      color: "white",
      boxShadow: "0 10px 30px rgba(0,0,0,0.4)",
    },
    title: {
      textAlign: "center",
      marginBottom: "20px",
    },
    input: {
      width: "100%",
      padding: "12px",
      margin: "10px 0",
      borderRadius: "8px",
      border: "1px solid #333",
      backgroundColor: "#2c2c2c",
      color: "white",
      boxSizing: "border-box",
    },
    button: {
      width: "100%",
      padding: "14px",
      borderRadius: "8px",
      border: "none",
      backgroundColor: "#6200ea",
      color: "white",
      cursor: loading ? "not-allowed" : "pointer",
      fontWeight: "bold",
      marginTop: "10px",
      opacity: loading ? 0.7 : 1,
    },
    error: {
      backgroundColor: "rgba(244, 67, 54, 0.1)",
      color: "#ff5252",
      padding: "10px",
      borderRadius: "8px",
      marginBottom: "15px",
      textAlign: "center",
    },
    footer: {
      textAlign: "center",
      marginTop: "20px",
      color: "#a0a0a0",
    },
    link: {
      color: "#6200ea",
      textDecoration: "none",
      fontWeight: "bold",
    },
  };

  return (
    <div style={styles.container}>
      <div style={styles.card}>
        <h2 style={styles.title}>Login to SnapSphere</h2>

        {error && <div style={styles.error}>{error}</div>}

        <form onSubmit={handleSubmit}>
          <label>Email</label>
          <input
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            style={styles.input}
          />

          <label>Password</label>
          <input
            type="password"
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            style={styles.input}
          />

          <button
            disabled={loading}
            type="submit"
            style={styles.button}
          >
            {loading ? "Logging in..." : "Login"}
          </button>
        </form>

        <p style={styles.footer}>
          Need an account?{" "}
          <Link to="/signup" style={styles.link}>
            Sign Up
          </Link>
        </p>
      </div>
    </div>
  );
}