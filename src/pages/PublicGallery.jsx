import React from "react";
import { useNavigate } from "react-router-dom";

export default function PublicGallery() {
  const navigate = useNavigate();
  return (
    <div style={{ padding: "40px", backgroundColor: "#121212", color: "white", minHeight: "100vh", fontFamily: "sans-serif" }}>
      <button onClick={() => navigate("/")} style={{ padding: "8px 16px", marginBottom: "20px", cursor: "pointer" }}>← Back to Dashboard</button>
      <h2>Public Gallery & AI Search</h2>
      <p style={{ color: "#a0a0a0" }}>Anyone with an account can view this content and use face search here.</p>
    </div>
  );
}