// src/pages/Profile.jsx

import React, { useState, useEffect, useRef } from "react";
import { doc, getDoc } from "firebase/firestore";
import { db } from "../firebase";
import { useAuth } from "../context/AuthContext";
import DashboardBackButton from "../components/DashboardBackButton";

export default function Profile() {
  const { currentUser, userProfile } = useAuth();
  
  const [faceProfile, setFaceProfile] = useState(null);
  const [isRegistering, setIsRegistering] = useState(false);
  const [error, setError] = useState("");
  const fileInputRef = useRef(null);

  useEffect(() => {
    if (!currentUser) return;
    const fetchFaceProfile = async () => {
      try {
        const snap = await getDoc(doc(db, "faceProfiles", currentUser.uid));
        if (snap.exists()) setFaceProfile(snap.data());
      } catch (err) {
        console.error("Error fetching face profile:", err);
      }
    };
    fetchFaceProfile();
  }, [currentUser]);

  const handleSelfieUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setIsRegistering(true);
    setError("");

    const formData = new FormData();
    formData.append("selfie", file);
    formData.append("uid", currentUser.uid);

    try {
      const response = await fetch("https://snapshare-backend-zqhh.onrender.com/api/faces/register", {
        method: "POST",
        body: formData
      });

      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Failed to register face.");

      setFaceProfile({ selfieUrl: data.selfieUrl });
      alert("Face successfully registered for Auto-Tagging!");
    } catch (err) {
      setError(err.message);
    } finally {
      setIsRegistering(false);
    }
  };

  const styles = {
    container: { minHeight: "100vh", backgroundColor: "#121212", color: "#ffffff", padding: "40px 20px", fontFamily: "sans-serif" },
    wrapper: { maxWidth: "1200px", margin: "0 auto" },
    header: { display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "30px", flexWrap: "wrap", gap: "15px" },
    title: { margin: 0, fontSize: "32px", color: "#ffffff" },
    section: { backgroundColor: "#1e1e1e", padding: "30px", borderRadius: "12px", border: "1px solid #2a2a2a", marginTop: "20px" },
    btn: { padding: "10px 20px", backgroundColor: "#6200ea", color: "#fff", border: "none", borderRadius: "6px", cursor: "pointer", fontWeight: "bold" },
    preview: { width: "150px", height: "150px", borderRadius: "50%", objectFit: "cover", marginBottom: "15px", border: "3px solid #6200ea" },
    error: { backgroundColor: "rgba(244, 67, 54, 0.1)", color: "#ff5252", padding: "10px", borderRadius: "6px", marginBottom: "15px", border: "1px solid rgba(244, 67, 54, 0.3)" }
  };

  return (
    <div style={styles.container}>
      <div style={styles.wrapper}>
        
        {/* EXACT REFERENCE LAYOUT */}
        <div style={styles.header}>
          <div style={{ display: "flex", alignItems: "center", gap: "15px" }}>
            <DashboardBackButton />
            <h1 style={styles.title}>My Profile</h1>
          </div>
        </div>

        <p style={{ color: "#a0a0a0", marginBottom: "20px", fontSize: "16px" }}>Update your details and upload your reference selfie for Face Recognition.</p>

        <div style={{ marginBottom: "20px", padding: "20px", backgroundColor: "#1e1e1e", borderRadius: "12px", border: "1px solid #2a2a2a" }}>
          <p style={{ margin: "0 0 10px 0" }}><strong>Name:</strong> {userProfile?.name || "Loading..."}</p>
          <p style={{ margin: 0 }}><strong>Role:</strong> <span style={{ color: "#b388ff", fontWeight: "bold" }}>{userProfile?.role || "Loading..."}</span></p>
        </div>

        <div style={styles.section}>
          <h2 style={{ fontSize: "20px", marginTop: 0 }}>🤖 AI Facial Recognition</h2>
          <p style={{ color: "#a0a0a0", fontSize: "14px", lineHeight: "1.5", marginBottom: "20px" }}>
            Upload a clear selfie. Whenever an event photographer uploads a photo containing your face across the platform, it will automatically appear in your "My Photos" gallery.
          </p>

          {error && <div style={styles.error}>{error}</div>}

          <div style={{ textAlign: "center", marginTop: "30px" }}>
            {faceProfile?.selfieUrl ? (
              <>
                <img src={faceProfile.selfieUrl} alt="Registered Face" style={styles.preview} />
                <span style={{ display: "block", color: "#69f0ae", marginBottom: "15px", fontWeight: "bold" }}>✓ Face Registered</span>
              </>
            ) : (
              <div style={{ ...styles.preview, margin: "0 auto 15px auto", display: "flex", alignItems: "center", justifyContent: "center", backgroundColor: "#121212", border: "3px dashed #444", fontSize: "40px" }}>
                👤
              </div>
            )}

            <input type="file" accept="image/*" ref={fileInputRef} onChange={handleSelfieUpload} style={{ display: "none" }} />
            
            <button style={styles.btn} onClick={() => fileInputRef.current.click()} disabled={isRegistering}>
              {isRegistering ? "⏳ Registering AI Face..." : (faceProfile ? "Replace Reference Selfie" : "Upload Reference Selfie")}
            </button>
          </div>
        </div>

      </div>
    </div>
  );
}