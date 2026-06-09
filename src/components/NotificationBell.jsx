// src/components/NotificationBell.jsx

import React, { useState, useEffect, useRef } from "react";
import { collection, query, where, onSnapshot, doc, updateDoc, writeBatch } from "firebase/firestore";
import { db } from "../firebase";
import { useAuth } from "../context/AuthContext";
import { useNavigate } from "react-router-dom";

export default function NotificationBell() {
  const { currentUser } = useAuth();
  const navigate = useNavigate();
  const [notifications, setNotifications] = useState([]);
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef(null);

  useEffect(() => {
    if (!currentUser) return;
    const q = query(collection(db, "notifications"), where("receiverId", "==", currentUser.uid));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const notifs = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      notifs.sort((a, b) => (b.createdAt?.toMillis() || 0) - (a.createdAt?.toMillis() || 0));
      setNotifications(notifs);
    });
    return () => unsubscribe();
  }, [currentUser]);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const unreadCount = notifications.filter(n => !n.read).length;

  const markAllRead = async (e) => {
    e.stopPropagation();
    const unreadNotifs = notifications.filter(n => !n.read);
    if (unreadNotifs.length === 0) return;
    
    const batch = writeBatch(db);
    unreadNotifs.forEach(notif => {
      const ref = doc(db, "notifications", notif.id);
      batch.update(ref, { read: true });
    });
    await batch.commit();
  };

  const handleNotificationClick = async (notif) => {
    setIsOpen(false);
    if (!notif.read) {
      try {
        await updateDoc(doc(db, "notifications", notif.id), { read: true });
      } catch (err) { console.error("Error updating notification:", err); }
    }
    // Deep Link to exact media
    if (notif.eventId && notif.mediaId) {
      navigate(`/events/${notif.eventId}?mediaId=${notif.mediaId}`);
    } else if (notif.eventId) {
      navigate(`/events/${notif.eventId}`);
    }
  };

  const getIcon = (type) => {
    if (type === "like") return "❤️";
    if (type === "comment") return "💬";
    if (type === "tag") return "🏷️";
    return "🔔";
  };

  const timeAgo = (timestamp) => {
    if (!timestamp) return "Just now";
    const seconds = Math.floor((new Date() - timestamp.toDate()) / 1000);
    if (seconds < 60) return `${seconds}s ago`;
    const minutes = Math.floor(seconds / 60);
    if (minutes < 60) return `${minutes}m ago`;
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours}h ago`;
    return `${Math.floor(hours / 24)}d ago`;
  };

  const styles = {
    container: { position: "relative", display: "inline-block" },
    bellBtn: { background: "none", border: "none", fontSize: "24px", cursor: "pointer", position: "relative", color: "#ffffff", padding: "5px" },
    badge: { position: "absolute", top: "0px", right: "0px", backgroundColor: "#ff5252", color: "white", borderRadius: "50%", padding: "2px 6px", fontSize: "12px", fontWeight: "bold" },
    dropdown: { position: "absolute", top: "45px", right: "0", width: "340px", backgroundColor: "#1e1e1e", borderRadius: "12px", border: "1px solid #333", boxShadow: "0 10px 30px rgba(0,0,0,0.5)", zIndex: 1000, overflow: "hidden", display: isOpen ? "block" : "none" },
    header: { padding: "15px", borderBottom: "1px solid #2a2a2a", display: "flex", justifyContent: "space-between", alignItems: "center", backgroundColor: "#242424" },
    title: { margin: 0, fontSize: "16px", fontWeight: "bold", color: "#fff" },
    actions: { display: "flex", gap: "10px" },
    actionBtn: { background: "none", border: "none", color: "#69f0ae", fontSize: "12px", cursor: "pointer", fontWeight: "bold" },
    list: { maxHeight: "350px", overflowY: "auto", padding: 0, margin: 0, listStyle: "none" },
    item: (isRead) => ({ padding: "15px", borderBottom: "1px solid #2a2a2a", cursor: "pointer", backgroundColor: isRead ? "#1e1e1e" : "rgba(98, 0, 234, 0.15)", transition: "background 0.2s", display: "flex", alignItems: "center", gap: "10px" }),
    iconWrap: { fontSize: "18px" },
    textWrap: { flex: 1 },
    message: { margin: 0, fontSize: "13px", lineHeight: "1.4" },
    time: { margin: "4px 0 0 0", fontSize: "11px", color: "#a0a0a0" },
    empty: { padding: "40px 20px", textAlign: "center", color: "#a0a0a0", fontSize: "14px" }
  };

  return (
    <div style={styles.container} ref={dropdownRef}>
      <button style={styles.bellBtn} onClick={() => setIsOpen(!isOpen)}>
        🔔
        {unreadCount > 0 && <span style={styles.badge}>{unreadCount > 99 ? '99+' : unreadCount}</span>}
      </button>

      <div style={styles.dropdown}>
        <div style={styles.header}>
          <h3 style={styles.title}>Notifications</h3>
          <div style={styles.actions}>
            {unreadCount > 0 && <button style={styles.actionBtn} onClick={markAllRead}>✓ Read All</button>}
            <button style={styles.actionBtn} onClick={() => { setIsOpen(false); navigate("/notifications"); }}>View All</button>
          </div>
        </div>
        
        {notifications.length === 0 ? (
          <div style={styles.empty}>
            <div style={{ fontSize: "30px", marginBottom: "10px" }}>🔔</div>
            No notifications yet
          </div>
        ) : (
          <ul style={styles.list}>
            {notifications.slice(0, 5).map(notif => (
              <li 
                key={notif.id} 
                style={styles.item(notif.read)} 
                onClick={() => handleNotificationClick(notif)}
                onMouseEnter={e => e.currentTarget.style.backgroundColor = notif.read ? "#242424" : "rgba(98, 0, 234, 0.25)"}
                onMouseLeave={e => e.currentTarget.style.backgroundColor = notif.read ? "#1e1e1e" : "rgba(98, 0, 234, 0.15)"}
              >
                <div style={styles.iconWrap}>{getIcon(notif.type)}</div>
                <div style={styles.textWrap}>
                  <p style={{
                    ...styles.message,
                    color: notif.read ? "#e0e0e0" : "#ffffff",
                    fontWeight: notif.read ? "normal" : "bold"
                  }}>
                    {notif.message}
                  </p>
                  <p style={styles.time}>{timeAgo(notif.createdAt)}</p>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}