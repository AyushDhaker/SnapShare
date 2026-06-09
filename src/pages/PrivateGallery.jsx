import React from "react";
import { useNavigate } from "react-router-dom";

export default function PrivateGallery() {
  const navigate = useNavigate();
  return (
    <div style={{ padding: "40px", backgroundColor: "#121212", color: "white", minHeight: "100vh", fontFamily: "sans-serif" }}>
      <button onClick={() => navigate("/")} style={{ padding: "8px 16px", marginBottom: "20px", cursor: "pointer" }}>← Back to Dashboard</button>
      <h2>Private Gallery</h2>
      <p style={{ color: "#a0a0a0" }}>Restricted access. Only ClubMembers, Photographers, and Admins can see this.</p>
    </div>
  );
}