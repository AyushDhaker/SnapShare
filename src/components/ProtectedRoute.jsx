import React from "react";
import { Navigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

export default function ProtectedRoute({ children }) {
  const { currentUser, userProfile, loading } = useAuth();

  if (loading) {
    return <h2>Loading...</h2>;
  }

  if (!currentUser) {
    return <Navigate to="/login" />;
  }

  // New check
  if (userProfile && !userProfile.isApproved) {
    return (
      <div
        style={{
          minHeight: "100vh",
          background: "#121212",
          color: "white",
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          flexDirection: "column",
        }}
      >
        <h2>Account Pending Approval</h2>
        <p>Please wait for an Admin to approve your account.</p>
      </div>
    );
  }

  return children;
}