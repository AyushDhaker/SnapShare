// src/components/DashboardBackButton.jsx

import React from "react";
import { useNavigate } from "react-router-dom";

export default function DashboardBackButton() {
  const navigate = useNavigate();

  const buttonStyle = {
    padding: "10px 20px",
    backgroundColor: "#2c2c2c",
    color: "#ffffff",
    border: "1px solid #444",
    borderRadius: "8px",
    cursor: "pointer",
    fontSize: "14px",
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    transition: "background-color 0.2s ease",
  };

  return (
    <button
      onClick={() => navigate("/dashboard")}
      style={buttonStyle}
      onMouseOver={(e) => (e.currentTarget.style.backgroundColor = "#333")}
      onMouseOut={(e) => (e.currentTarget.style.backgroundColor = "#2c2c2c")}
    >
      ← Dashboard
    </button>
  );
}