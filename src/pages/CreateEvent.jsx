// src/pages/CreateEvent.jsx

import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { collection, addDoc, serverTimestamp } from "firebase/firestore";
import { db } from "../firebase";
import { useAuth } from "../context/AuthContext";

export default function CreateEvent() {
  const [eventName, setEventName] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState("Technical");
  const [eventDate, setEventDate] = useState("");
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const { currentUser, userProfile } = useAuth();
  if (userProfile?.role !== "Admin") {
    return (
        <div
        style={{
            minHeight: "100vh",
            backgroundColor: "#121212",
            color: "white",
            display: "flex",
            justifyContent: "center",
            alignItems: "center"
        }}
        >
        <h2>Access Denied</h2>
        </div>
    );
    }
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!eventName || !description || !category || !eventDate) {
      return setError("Please fill out all fields.");
    }

    try {
      setError("");
      setSuccess("");
      setLoading(true);

      await addDoc(collection(db, "events"), {
        eventName,
        description,
        category,
        eventDate,
        status: "Upcoming",
        createdBy: currentUser.uid,
        createdByName: userProfile.name,
        createdAt: serverTimestamp()
      });

      setSuccess("Event created successfully!");
      
      // Clear form
      setEventName("");
      setDescription("");
      setCategory("Technical");
      setEventDate("");
      
      // Optional: Redirect back to events page after a short delay
      setTimeout(() => navigate("/events"), 1500);

    } catch (err) {
      console.error("Error creating event:", err);
      setError("Failed to create event. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  // Dark UI Inline Styles
  const styles = {
    container: { minHeight: "100vh", backgroundColor: "#121212", color: "#ffffff", padding: "40px 20px", fontFamily: "sans-serif", display: "flex", justifyContent: "center", alignItems: "center" },
    card: { backgroundColor: "#1e1e1e", padding: "40px", borderRadius: "12px", border: "1px solid #2a2a2a", width: "100%", maxWidth: "600px", boxShadow: "0 10px 30px rgba(0,0,0,0.5)" },
    header: { display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px" },
    title: { margin: 0, fontSize: "24px" },
    backBtn: { padding: "8px 16px", backgroundColor: "#2c2c2c", color: "#ffffff", border: "1px solid #444", borderRadius: "6px", cursor: "pointer" },
    formGroup: { marginBottom: "20px" },
    label: { display: "block", marginBottom: "8px", color: "#a0a0a0", fontSize: "14px" },
    input: { width: "100%", padding: "12px", borderRadius: "8px", border: "1px solid #333", backgroundColor: "#2c2c2c", color: "#ffffff", boxSizing: "border-box", outline: "none" },
    textarea: { width: "100%", padding: "12px", borderRadius: "8px", border: "1px solid #333", backgroundColor: "#2c2c2c", color: "#ffffff", boxSizing: "border-box", minHeight: "120px", outline: "none", resize: "vertical" },
    select: { width: "100%", padding: "12px", borderRadius: "8px", border: "1px solid #333", backgroundColor: "#2c2c2c", color: "#ffffff", boxSizing: "border-box", outline: "none", cursor: "pointer" },
    button: { width: "100%", padding: "14px", backgroundColor: "#6200ea", color: "#ffffff", border: "none", borderRadius: "8px", fontSize: "16px", fontWeight: "bold", cursor: loading ? "not-allowed" : "pointer", opacity: loading ? 0.7 : 1 },
    error: { backgroundColor: "rgba(244, 67, 54, 0.1)", color: "#ff5252", padding: "12px", borderRadius: "8px", marginBottom: "20px", border: "1px solid rgba(244, 67, 54, 0.3)" },
    success: { backgroundColor: "rgba(76, 175, 80, 0.1)", color: "#69f0ae", padding: "12px", borderRadius: "8px", marginBottom: "20px", border: "1px solid rgba(76, 175, 80, 0.3)" }
  };

  return (
    <div style={styles.container}>
      <div style={styles.card}>
        <div style={styles.header}>
          <h2 style={styles.title}>Create New Event</h2>
          <button onClick={() => navigate("/events")} style={styles.backBtn}>Cancel</button>
        </div>

        {error && <div style={styles.error}>{error}</div>}
        {success && <div style={styles.success}>{success}</div>}

        <form onSubmit={handleSubmit}>
          <div style={styles.formGroup}>
            <label style={styles.label}>Event Name</label>
            <input type="text" value={eventName} onChange={(e) => setEventName(e.target.value)} required style={styles.input} placeholder="e.g. Annual Tech Fest 2026" />
          </div>

          <div style={styles.formGroup}>
            <label style={styles.label}>Event Date</label>
            <input type="date" value={eventDate} onChange={(e) => setEventDate(e.target.value)} required style={styles.input} />
          </div>

          <div style={styles.formGroup}>
            <label style={styles.label}>Category</label>
            <select value={category} onChange={(e) => setCategory(e.target.value)} style={styles.select}>
              <option value="Technical">Technical</option>
              <option value="Cultural">Cultural</option>
              <option value="Sports">Sports</option>
              <option value="Workshop">Workshop</option>
              <option value="Seminar">Seminar</option>
              <option value="Other">Other</option>
            </select>
          </div>

          <div style={styles.formGroup}>
            <label style={styles.label}>Description</label>
            <textarea value={description} onChange={(e) => setDescription(e.target.value)} required style={styles.textarea} placeholder="Describe the event details, venue, and timings..." />
          </div>

          <button type="submit" disabled={loading} style={styles.button}>
            {loading ? "Creating..." : "Create Event"}
          </button>
        </form>
      </div>
    </div>
  );
}