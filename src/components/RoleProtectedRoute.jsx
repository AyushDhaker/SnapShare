import React from "react";
import { Navigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

export default function RoleProtectedRoute({ children, roles }) {
  const { currentUser, userProfile, loading } = useAuth();
  console.log("RoleProtectedRoute");
console.log("currentUser:", currentUser);
console.log("userProfile:", userProfile);
console.log("loading:", loading);
console.log("allowed roles:", roles);

  // Wait until auth/profile loading finishes
  if (loading) {
    return <h2>Loading...</h2>;
  }

  // Not logged in
  if (!currentUser) {
    return <Navigate to="/login" replace />;
  }

  // Profile missing
  if (!userProfile) {
    return <Navigate to="/login" replace />;
  }

  // Logged in but doesn't have required role
  if (!roles.includes(userProfile.role)) {
    return <Navigate to="/" replace />;
  }

  return children;
}