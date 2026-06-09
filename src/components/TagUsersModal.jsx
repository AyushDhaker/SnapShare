// src/components/TagUsersModal.jsx

import React, { useState, useEffect } from "react";
import { collection, getDocs } from "firebase/firestore";
import { db } from "../firebase";

export default function TagUsersModal({ isOpen, onClose, mediaItem, onSaveTags }) {
  const [searchQuery, setSearchQuery] = useState("");
  const [allUsers, setAllUsers] = useState([]);
  const [selectedUsers, setSelectedUsers] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (isOpen) {
      fetchUsers();
      // Load previously saved tags if they exist
      setSelectedUsers(mediaItem?.taggedUsers || []);
      setSearchQuery("");
    }
  }, [isOpen, mediaItem]);

  const fetchUsers = async () => {
    setLoading(true);
    try {
      // Fetch all users from Firestore to allow local real-time filtering
      const usersSnap = await getDocs(collection(db, "users"));
      const usersList = usersSnap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setAllUsers(usersList);
    } catch (err) {
      console.error("Error fetching users:", err);
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  // Filter out users that match the search query AND haven't been selected yet
  const filteredUsers = allUsers.filter(u => 
    (u.name && u.name.toLowerCase().includes(searchQuery.toLowerCase())) ||
    (u.email && u.email.toLowerCase().includes(searchQuery.toLowerCase()))
  ).filter(u => !selectedUsers.some(su => su.uid === u.id));

  const handleSelectUser = (user) => {
    // Add to selection using the exact requested database structure
    setSelectedUsers(prev => [...prev, { uid: user.id, displayName: user.name }]);
    setSearchQuery(""); // Clear search bar for next selection
  };

  const handleRemoveUser = (uid) => {
    setSelectedUsers(prev => prev.filter(u => u.uid !== uid));
  };

  const handleSave = () => {
    onSaveTags(mediaItem.id, selectedUsers);
    onClose();
  };

  const styles = {
    overlay: { position: "fixed", top: 0, left: 0, width: "100vw", height: "100vh", backgroundColor: "rgba(0, 0, 0, 0.7)", zIndex: 10003, display: "flex", justifyContent: "center", alignItems: "center", backdropFilter: "blur(2px)" },
    modal: { width: "90%", maxWidth: "450px", maxHeight: "85vh", backgroundColor: "#1e1e1e", borderRadius: "12px", border: "1px solid #333", display: "flex", flexDirection: "column", boxShadow: "0 15px 40px rgba(0,0,0,0.6)", overflow: "hidden", padding: "20px" },
    header: { display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "15px" },
    title: { margin: 0, fontSize: "18px", color: "#ffffff", fontWeight: "bold" },
    closeBtn: { background: "none", border: "none", color: "#a0a0a0", fontSize: "28px", cursor: "pointer", padding: 0, lineHeight: "1" },
    input: { width: "100%", padding: "12px", borderRadius: "8px", border: "1px solid #444", backgroundColor: "#2c2c2c", color: "white", outline: "none", fontSize: "14px", marginBottom: "15px", boxSizing: "border-box" },
    selectedContainer: { display: "flex", flexWrap: "wrap", gap: "8px", marginBottom: "15px" },
    tagBadge: { display: "flex", alignItems: "center", gap: "5px", backgroundColor: "rgba(98, 0, 234, 0.2)", color: "#b388ff", padding: "6px 12px", borderRadius: "20px", fontSize: "13px", fontWeight: "bold" },
    removeTag: { background: "none", border: "none", color: "#ff5252", cursor: "pointer", fontSize: "14px", marginLeft: "5px", padding: 0 },
    resultsList: { flex: 1, overflowY: "auto", backgroundColor: "#121212", borderRadius: "8px", border: "1px solid #333", maxHeight: "200px", marginBottom: "20px" },
    userItem: { padding: "12px 15px", borderBottom: "1px solid #2a2a2a", cursor: "pointer", display: "flex", flexDirection: "column", transition: "background-color 0.2s" },
    userName: { margin: 0, color: "#ffffff", fontSize: "14px", fontWeight: "bold" },
    userEmail: { margin: 0, color: "#a0a0a0", fontSize: "12px" },
    saveBtn: { width: "100%", padding: "12px", backgroundColor: "#6200ea", color: "white", border: "none", borderRadius: "8px", cursor: "pointer", fontWeight: "bold", transition: "opacity 0.2s" }
  };

  return (
    <div style={styles.overlay} onClick={onClose}>
      <div style={styles.modal} onClick={e => e.stopPropagation()}>
        <div style={styles.header}>
          <h3 style={styles.title}>Tag Users</h3>
          <button style={styles.closeBtn} onClick={onClose}>&times;</button>
        </div>

        {/* Selected Users */}
        {selectedUsers.length > 0 && (
          <div style={styles.selectedContainer}>
            {selectedUsers.map(u => (
              <span key={u.uid} style={styles.tagBadge}>
                {u.displayName}
                <button style={styles.removeTag} onClick={() => handleRemoveUser(u.uid)}>✕</button>
              </span>
            ))}
          </div>
        )}

        <input 
          type="text" 
          placeholder="Search by name or email..." 
          value={searchQuery} 
          onChange={e => setSearchQuery(e.target.value)} 
          style={styles.input}
        />

        <div style={styles.resultsList}>
          {loading ? (
            <div style={{ padding: "15px", color: "#a0a0a0", textAlign: "center", fontSize: "14px" }}>Loading users...</div>
          ) : searchQuery.trim() === "" ? (
            <div style={{ padding: "15px", color: "#a0a0a0", textAlign: "center", fontSize: "14px" }}>Type to search users...</div>
          ) : filteredUsers.length === 0 ? (
            <div style={{ padding: "15px", color: "#a0a0a0", textAlign: "center", fontSize: "14px" }}>No matching users found.</div>
          ) : (
            filteredUsers.map(user => (
              <div 
                key={user.id} 
                style={styles.userItem} 
                onClick={() => handleSelectUser(user)}
                onMouseOver={(e) => e.currentTarget.style.backgroundColor = "#242424"}
                onMouseOut={(e) => e.currentTarget.style.backgroundColor = "transparent"}
              >
                <p style={styles.userName}>{user.name}</p>
                <p style={styles.userEmail}>{user.email}</p>
              </div>
            ))
          )}
        </div>

        <button style={styles.saveBtn} onClick={handleSave}>Save Tags</button>
      </div>
    </div>
  );
}