// src/pages/Signup.jsx

import React, { useState } from "react";
import { useAuth } from "../context/AuthContext";
import { useNavigate, Link } from "react-router-dom";

export default function Signup() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [loading, setLoading] = useState(false);

  const { signup } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();

    // Validation for password mismatch
    if (password !== confirmPassword) {
      return setError("Passwords do not match.");
    }

    if (password.length < 6) {
      return setError("Password must be at least 6 characters.");
    }

    try {
      setError("");
      setSuccess("");
      setLoading(true);
      
      // Use updated signup() from AuthContext, passing the name
      await signup(name, email, password);
      
      setSuccess("Account created successfully with Viewer role!");
      
      // Clear form on success
      setName("");
      setEmail("");
      setPassword("");
      setConfirmPassword("");

      // UPDATED: Redirect to dashboard after successful signup
      navigate("/dashboard", { replace: true });

    } catch (err) {
      setError("Failed to create an account: " + err.message);
    } finally {
      setLoading(false);
    }
  };

  // Modern dark UI using inline CSS
  const styles = {
    container: {
      minHeight: "100vh",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      backgroundColor: "#121212",
      fontFamily: "'Inter', 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif",
      padding: "20px",
    },
    card: {
      backgroundColor: "#1e1e1e",
      padding: "40px",
      borderRadius: "16px",
      boxShadow: "0 10px 30px rgba(0, 0, 0, 0.5)",
      width: "100%",
      maxWidth: "450px",
      color: "#ffffff",
      border: "1px solid #2a2a2a",
    },
    title: {
      textAlign: "center",
      marginBottom: "30px",
      fontSize: "28px",
      fontWeight: "700",
      letterSpacing: "0.5px",
    },
    alertError: {
      backgroundColor: "rgba(244, 67, 54, 0.1)",
      color: "#ff5252",
      padding: "12px",
      borderRadius: "8px",
      marginBottom: "20px",
      fontSize: "14px",
      textAlign: "center",
      border: "1px solid rgba(244, 67, 54, 0.3)",
    },
    alertSuccess: {
      backgroundColor: "rgba(76, 175, 80, 0.1)",
      color: "#69f0ae",
      padding: "12px",
      borderRadius: "8px",
      marginBottom: "20px",
      fontSize: "14px",
      textAlign: "center",
      border: "1px solid rgba(76, 175, 80, 0.3)",
    },
    formGroup: {
      marginBottom: "20px",
    },
    label: {
      display: "block",
      marginBottom: "8px",
      fontSize: "14px",
      color: "#a0a0a0",
      fontWeight: "500",
    },
    input: {
      width: "100%",
      padding: "14px",
      borderRadius: "8px",
      border: "1px solid #333",
      backgroundColor: "#2c2c2c",
      color: "#ffffff",
      fontSize: "15px",
      boxSizing: "border-box",
      outline: "none",
      transition: "border-color 0.3s ease",
    },
    button: {
      width: "100%",
      padding: "14px",
      borderRadius: "8px",
      border: "none",
      backgroundColor: "#6200ea",
      color: "#ffffff",
      fontSize: "16px",
      fontWeight: "600",
      cursor: loading ? "not-allowed" : "pointer",
      marginTop: "10px",
      transition: "background-color 0.3s ease",
      opacity: loading ? 0.7 : 1,
    },
    footer: {
      textAlign: "center",
      marginTop: "25px",
      color: "#a0a0a0",
      fontSize: "14px",
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
        <h2 style={styles.title}>Join SnapSphere</h2>
        
        {/* Show error messages */}
        {error && <div style={styles.alertError}>{error}</div>}
        {success && <div style={styles.alertSuccess}>{success}</div>}

        <form onSubmit={handleSubmit}>
          {/* Name field */}
          <div style={styles.formGroup}>
            <label style={styles.label}>Full Name</label>
            <input
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              style={styles.input}
              placeholder="John Doe"
            />
          </div>

          {/* Email field */}
          <div style={styles.formGroup}>
            <label style={styles.label}>Email Address</label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              style={styles.input}
              placeholder="john@example.com"
            />
          </div>

          {/* Password field */}
          <div style={styles.formGroup}>
            <label style={styles.label}>Password</label>
            <input
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              style={styles.input}
              placeholder="••••••••"
            />
          </div>

          {/* Confirm Password field */}
          <div style={styles.formGroup}>
            <label style={styles.label}>Confirm Password</label>
            <input
              type="password"
              required
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              style={styles.input}
              placeholder="••••••••"
            />
          </div>

          {/* Submit Button showing loading state */}
          <button disabled={loading} type="submit" style={styles.button}>
            {loading ? "Creating Account..." : "Sign Up"}
          </button>
        </form>

        <p style={styles.footer}>
          Already have an account?{" "}
          <Link to="/login" style={styles.link}>
            Login
          </Link>
        </p>
      </div>
    </div>
  );
}