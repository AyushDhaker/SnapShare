// src/pages/UploadMedia.jsx

import React, { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { collection, getDocs, addDoc, serverTimestamp } from "firebase/firestore";
import { db } from "../firebase";
import { useAuth } from "../context/AuthContext";

export default function UploadMedia() {
  // Global Settings for the Batch
  const [events, setEvents] = useState([]);
  const [selectedEventId, setSelectedEventId] = useState("");
  const [visibility, setVisibility] = useState("Public");
  
  // File Management State
  const [files, setFiles] = useState([]);
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef(null);

  // Upload Progress & UI State
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(true);
  const [progress, setProgress] = useState({ current: 0, total: 0 });
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  // NEW: Extract userProfile to get the uploadedByName
  const { currentUser, userProfile } = useAuth();
  const navigate = useNavigate();

  // Load available events for the dropdown
  useEffect(() => {
    const fetchEvents = async () => {
      try {
        const querySnapshot = await getDocs(collection(db, "events"));
        const eventsList = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        setEvents(eventsList);
        if (eventsList.length > 0) setSelectedEventId(eventsList[0].id);
      } catch (err) {
        console.error("Error loading events:", err);
        setError("Failed to load events.");
      } finally {
        setFetching(false);
      }
    };
    fetchEvents();
  }, []);

  // --- Drag and Drop Handlers ---
  const handleDragOver = (e) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      const droppedFiles = Array.from(e.dataTransfer.files);
      setFiles((prev) => [...prev, ...droppedFiles]);
    }
  };

  const handleFileSelect = (e) => {
    if (e.target.files && e.target.files.length > 0) {
      const selectedFiles = Array.from(e.target.files);
      setFiles((prev) => [...prev, ...selectedFiles]);
    }
  };

  const removeFile = (indexToRemove) => {
    setFiles(files.filter((_, index) => index !== indexToRemove));
  };

  // --- AWS UPLOAD LOGIC ---
  const handleBatchUpload = async () => {
    if (!selectedEventId || files.length === 0) {
      return setError("Please select an event and add at least one file.");
    }

    try {
      setError("");
      setSuccess("");
      setLoading(true);
      setProgress({ current: 0, total: files.length });

      // NEW: Extract Event Name and Category from the already loaded events state
      const selectedEvent = events.find(ev => ev.id === selectedEventId);
      const eventName = selectedEvent?.eventName || "Unknown Event";
      const category = selectedEvent?.category || "Uncategorized";
      
      // NEW: Extract Uploader Name
      const uploadedByName = userProfile?.name || currentUser?.displayName || "Unknown User";

      // Iterate through each file and upload
      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        
        // Update progress UI
        setProgress({ current: i + 1, total: files.length });

        // 1. Prepare data for Node.js Backend
        const formData = new FormData();
        formData.append("file", file);
        formData.append("eventId", selectedEventId);

        // 2. Send to our Backend API (which sends to AWS S3)
        const response = await fetch("http://localhost:5000/api/upload/media", {
          method: "POST",
          body: formData,
        });

        const data = await response.json();

        if (!data.success) {
          throw new Error(data.message || "AWS Upload Failed");
        }

        const realAwsUrl = data.url;

        // 3. Create one Firestore document per file with the enriched schema
        const docRef = await addDoc(collection(db, "media"), {
          eventId: selectedEventId,
          eventName: eventName,          // <-- NEW: Extracted Event Name
          category: category,            // <-- NEW: Extracted Category
          title: file.name,
          mediaUrl: realAwsUrl,
          mediaType: file.type,
          visibility: visibility,
          uploadedBy: currentUser.uid,
          uploadedByName: uploadedByName, // <-- NEW: Extracted Uploader Name
          uploadedAt: serverTimestamp(),

          likes: [],
          likesCount: 0,
          comments: [],        
          commentsCount: 0, 
          favorites: [],        
          favoritesCount: 0,
          taggedUsers: [],
          tags: [],
          matchedUsers: []
        });

        console.log("Upload Complete for:", file.name);

        // 4. Fire-and-forget Smart Tagging (Only for Images)
        if (file.type.startsWith("image/")) {
          fetch("http://localhost:5000/api/tags/generate", {
            method: "POST",
            headers: {
              "Content-Type": "application/json"
            },
            body: JSON.stringify({
              mediaId: docRef.id,
              mediaUrl: realAwsUrl
            })
          }).catch(err => console.error("Smart Tagging trigger failed:", err));
        }
      }

      setSuccess(`Successfully uploaded ${files.length} files to AWS S3 and linked to the event!`);
      setFiles([]); // Clear queue on success
      
    } catch (err) {
      console.error("Bulk upload error:", err);
      setError("An error occurred during the batch upload. Some files may have failed.");
    } finally {
      setLoading(false);
      setProgress({ current: 0, total: 0 });
    }
  };

  // --- Statistics Helpers ---
  const formatBytes = (bytes) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const totalSize = files.reduce((acc, file) => acc + file.size, 0);
  const imageCount = files.filter(f => f.type.startsWith("image/")).length;
  const videoCount = files.filter(f => f.type.startsWith("video/")).length;

  // --- UI Styles (Dark Theme) ---
  const styles = {
    container: { minHeight: "100vh", backgroundColor: "#121212", color: "#ffffff", padding: "40px 20px", fontFamily: "sans-serif" },
    wrapper: { maxWidth: "900px", margin: "0 auto" },
    card: { backgroundColor: "#1e1e1e", padding: "30px", borderRadius: "12px", border: "1px solid #2a2a2a", boxShadow: "0 10px 30px rgba(0,0,0,0.5)" },
    header: { display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px" },
    title: { margin: 0, fontSize: "24px" },
    backBtn: { padding: "8px 16px", backgroundColor: "#2c2c2c", color: "#ffffff", border: "1px solid #444", borderRadius: "6px", cursor: "pointer" },
    row: { display: "flex", gap: "20px", marginBottom: "20px", flexWrap: "wrap" },
    formGroup: { flex: 1, minWidth: "250px" },
    label: { display: "block", marginBottom: "8px", color: "#a0a0a0", fontSize: "14px", fontWeight: "bold" },
    select: { width: "100%", padding: "12px", borderRadius: "8px", border: "1px solid #333", backgroundColor: "#2c2c2c", color: "#ffffff", outline: "none", cursor: "pointer" },
    dropzone: { 
      border: `2px dashed ${isDragging ? "#6200ea" : "#444"}`, 
      borderRadius: "12px", 
      padding: "40px 20px", 
      textAlign: "center", 
      backgroundColor: isDragging ? "rgba(98, 0, 234, 0.1)" : "#242424",
      cursor: "pointer",
      transition: "all 0.3s ease",
      marginBottom: "20px"
    },
    statsBar: { display: "flex", justifyContent: "space-between", backgroundColor: "#2c2c2c", padding: "12px", borderRadius: "8px", marginBottom: "20px", fontSize: "14px", color: "#a0a0a0" },
    previewGrid: { display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(140px, 1fr))", gap: "15px", marginBottom: "20px", maxHeight: "400px", overflowY: "auto", paddingRight: "10px" },
    previewCard: { position: "relative", backgroundColor: "#242424", borderRadius: "8px", overflow: "hidden", border: "1px solid #333", display: "flex", flexDirection: "column" },
    previewMedia: { width: "100%", height: "100px", objectFit: "cover", backgroundColor: "#121212" },
    previewInfo: { padding: "8px", fontSize: "12px", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" },
    removeBtn: { position: "absolute", top: "5px", right: "5px", backgroundColor: "rgba(244, 67, 54, 0.9)", color: "white", border: "none", borderRadius: "50%", width: "24px", height: "24px", cursor: "pointer", fontWeight: "bold", display: "flex", alignItems: "center", justifyContent: "center" },
    uploadBtn: { width: "100%", padding: "16px", backgroundColor: "#6200ea", color: "#ffffff", border: "none", borderRadius: "8px", fontSize: "16px", fontWeight: "bold", cursor: loading ? "not-allowed" : "pointer", opacity: loading ? 0.7 : 1 },
    error: { backgroundColor: "rgba(244, 67, 54, 0.1)", color: "#ff5252", padding: "12px", borderRadius: "8px", marginBottom: "20px", border: "1px solid rgba(244, 67, 54, 0.3)" },
    success: { backgroundColor: "rgba(76, 175, 80, 0.1)", color: "#69f0ae", padding: "12px", borderRadius: "8px", marginBottom: "20px", border: "1px solid rgba(76, 175, 80, 0.3)" }
  };

  if (fetching) return <div style={styles.container}>Loading upload tools...</div>;

  return (
    <div style={styles.container}>
      <div style={styles.wrapper}>
        <div style={styles.card}>
          
          <div style={styles.header}>
            <h2 style={styles.title}>Bulk Media Upload</h2>
            <button onClick={() => navigate("/dashboard")} style={styles.backBtn}>Cancel</button>
          </div>

          {error && <div style={styles.error}>{error}</div>}
          {success && <div style={styles.success}>{success}</div>}

          {/* 1. Global Batch Settings */}
          <div style={styles.row}>
            <div style={styles.formGroup}>
              <label style={styles.label}>Select Event</label>
              <select 
                value={selectedEventId} 
                onChange={(e) => setSelectedEventId(e.target.value)} 
                style={styles.select}
                disabled={loading}
              >
                {events.length === 0 && <option value="">No events available</option>}
                {events.map(ev => (
                  <option key={ev.id} value={ev.id}>{ev.eventName} ({new Date(ev.eventDate).toLocaleDateString()})</option>
                ))}
              </select>
            </div>

            <div style={styles.formGroup}>
              <label style={styles.label}>Batch Visibility</label>
              <select 
                value={visibility} 
                onChange={(e) => setVisibility(e.target.value)} 
                style={styles.select}
                disabled={loading}
              >
                <option value="Public">Public (Visible to everyone)</option>
                <option value="Private">Private (Visible to Club Members only)</option>
              </select>
            </div>
          </div>

          {/* 2. Drag & Drop Zone */}
          <div 
            style={styles.dropzone}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            onClick={() => fileInputRef.current.click()}
          >
            <input 
              type="file" 
              multiple 
              accept="image/*,video/*"
              ref={fileInputRef}
              onChange={handleFileSelect}
              style={{ display: "none" }} 
              disabled={loading}
            />
            <h3 style={{ margin: "0 0 10px 0", color: "#ffffff" }}>Drag & Drop Media Here</h3>
            <p style={{ margin: 0, color: "#a0a0a0" }}>or click to browse your files (Images & Videos)</p>
          </div>

          {/* 3. Summary & Previews */}
          {files.length > 0 && (
            <>
              <div style={styles.statsBar}>
                <span><strong>Total Files:</strong> {files.length}</span>
                <span><strong>Images:</strong> {imageCount} | <strong>Videos:</strong> {videoCount}</span>
                <span><strong>Total Size:</strong> {formatBytes(totalSize)}</span>
              </div>

              <div style={styles.previewGrid}>
                {files.map((file, index) => {
                  const isVideo = file.type.startsWith("video/");
                  const objectUrl = URL.createObjectURL(file);

                  return (
                    <div key={`${file.name}-${index}`} style={styles.previewCard}>
                      <button 
                        onClick={() => removeFile(index)} 
                        style={styles.removeBtn}
                        disabled={loading}
                        title="Remove file"
                      >
                        ×
                      </button>
                      
                      {isVideo ? (
                        <video src={objectUrl} style={styles.previewMedia} muted />
                      ) : (
                        <img src={objectUrl} alt={file.name} style={styles.previewMedia} />
                      )}
                      
                      <div style={styles.previewInfo}>
                        <div style={{ color: "#ffffff", marginBottom: "4px" }}>{file.name}</div>
                        <div style={{ color: "#a0a0a0" }}>{formatBytes(file.size)}</div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </>
          )}

          {/* 4. Upload Action */}
          <button 
            onClick={handleBatchUpload} 
            disabled={loading || files.length === 0 || events.length === 0} 
            style={styles.uploadBtn}
          >
            {loading 
              ? `Uploading ${progress.current} of ${progress.total} files...` 
              : `Upload ${files.length} ${files.length === 1 ? 'File' : 'Files'}`
            }
          </button>

        </div>
      </div>
    </div>
  );
}