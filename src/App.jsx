// src/App.jsx

import React from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";

// Security Components
import ProtectedRoute from "./components/ProtectedRoute";
import RoleProtectedRoute from "./components/RoleProtectedRoute";

// Auth Pages
import LandingPage from "./pages/LandingPage";
import Login from "./pages/Login";
import Signup from "./pages/Signup";
import Dashboard from "./pages/Dashboard";

// Feature Pages
import Events from "./pages/Events";
import CreateEvent from "./pages/CreateEvent";
import EventDetails from "./pages/EventDetails";
import UploadMedia from "./pages/UploadMedia";
import AdminPanel from "./pages/AdminPanel";
import Notifications from "./pages/Notifications";
import Profile from "./pages/Profile";
import MyFavorites from "./pages/MyFavorites";
import MyPhotos from "./pages/MyPhotos";

function App() {
  return (
    <Router>
        <Routes>
          {/* Public Routes */}
          <Route path="/" element={<LandingPage />} />
          <Route path="/login" element={<Login />} />
          <Route path="/signup" element={<Signup />} />

          {/* General Dashboard (All Logged-in Users) */}
          <Route path="/dashboard" element={
            <ProtectedRoute>
              <Dashboard />
            </ProtectedRoute>
          } />
          
          {/* MY FAVORITES (Available to ALL logged-in roles) */}
          <Route path="/favorites" element={
            <RoleProtectedRoute roles={["Viewer", "ClubMember", "Photographer", "Admin"]}>
              <MyFavorites />
            </RoleProtectedRoute>
          } />

          {/* EVENTS & MEDIA VIEWING (Available to ALL roles) */}
          <Route path="/events" element={
            <RoleProtectedRoute roles={["Viewer", "ClubMember", "Photographer", "Admin"]}>
              <Events />
            </RoleProtectedRoute>
          } />
          
          {/* DYNAMIC EVENT DETAILS & GALLERY */}
          <Route path="/events/:eventId" element={
            <RoleProtectedRoute roles={["Viewer", "ClubMember", "Photographer", "Admin"]}>
              <EventDetails />
            </RoleProtectedRoute>
          } />
          
          {/* PROFILE */}
          <Route path="/profile" element={
            <RoleProtectedRoute roles={["Viewer", "ClubMember", "Photographer", "Admin"]}>
              <Profile />
            </RoleProtectedRoute>
          } />

          {/* NOTIFICATIONS (Available to ALL roles so Viewers can see Face Matches) */}
          <Route path="/notifications" element={
            <RoleProtectedRoute roles={["Viewer", "ClubMember", "Photographer", "Admin"]}>
              <Notifications />
            </RoleProtectedRoute>
          } />

          {/* UPLOAD MEDIA (Photographer, Admin) */}
          <Route path="/upload" element={
            <RoleProtectedRoute roles={["Photographer", "Admin"]}>
              <UploadMedia />
            </RoleProtectedRoute>
          } />

          {/* ADMIN ONLY ROUTES */}
          <Route path="/create-event" element={
            <RoleProtectedRoute roles={["Admin"]}>
              <CreateEvent />
            </RoleProtectedRoute>
          } />

          <Route path="/admin" element={
            <RoleProtectedRoute roles={["Admin"]}>
              <AdminPanel />
            </RoleProtectedRoute>
          } />
          
          {/* MY SMART PHOTOS */}
          <Route path="/my-photos" element={
            <RoleProtectedRoute roles={["Viewer", "ClubMember", "Photographer", "Admin"]}>
              <MyPhotos />
            </RoleProtectedRoute>
          } />
          
        </Routes>
    </Router>
  );
}

export default App;