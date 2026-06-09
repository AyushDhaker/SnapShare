// src/pages/Notifications.jsx

import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { collection, query, where, onSnapshot, doc, updateDoc, deleteDoc, writeBatch } from "firebase/firestore";
import { db } from "../firebase";
import { useAuth } from "../context/AuthContext";
import DashboardBackButton from "../components/DashboardBackButton";

export default function Notifications() {
  const navigate = useNavigate();
  const { currentUser } = useAuth();
  
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!currentUser) return;
    const q = query(
      collection(db, "notifications"),
      where("receiverId", "==", currentUser.uid)
    );
    
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const allNotifs = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      allNotifs.sort((a, b) => {
        const timeA = a.createdAt?.toMillis ? a.createdAt.toMillis() : 0;
        const timeB = b.createdAt?.toMillis ? b.createdAt.toMillis() : 0;
        return timeB - timeA;
      });
      setNotifications(allNotifs);
      setLoading(false);
    });
    
    return () => unsubscribe();
  }, [currentUser]);

  const handleNotificationClick = async (notif) => {
    if (!notif.read) {
      try { await updateDoc(doc(db, "notifications", notif.id), { read: true }); } 
      catch (err) { console.error(err); }
    }
    if (notif.eventId) {
      const targetUrl = notif.mediaId 
        ? `/events/${notif.eventId}?mediaId=${notif.mediaId}` 
        : `/events/${notif.eventId}`;
      navigate(targetUrl);
    }
  };

  const markAllAsRead = async () => {
    try {
      const batch = writeBatch(db);
      const unreadNotifs = notifications.filter(n => !n.read);
      if (unreadNotifs.length === 0) return;
      unreadNotifs.forEach(n => {
        const ref = doc(db, "notifications", n.id);
        batch.update(ref, { read: true });
      });
      await batch.commit();
    } catch (err) {
      console.error("Error marking all as read:", err);
    }
  };

  const deleteNotification = async (e, notifId) => {
    e.stopPropagation();
    try {
      await deleteDoc(doc(db, "notifications", notifId));
    } catch (err) {
      console.error("Error deleting notification:", err);
    }
  };

  const formatTimeAgo = (timestamp) => {
    if (!timestamp) return "Just now";
    const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
    const diffMins = Math.round((new Date() - date) / 60000);
    if (diffMins < 1) return "Just now";
    if (diffMins < 60) return `${diffMins} min ago`;
    const diffHrs = Math.floor(diffMins / 60);
    if (diffHrs < 24) return `${diffHrs} hour${diffHrs > 1 ? 's' : ''} ago`;
    const diffDays = Math.floor(diffHrs / 24);
    if (diffDays < 7) return `${diffDays} day${diffDays > 1 ? 's' : ''} ago`;
    return date.toLocaleDateString();
  };

  const getNotificationIcon = (type) => {
    switch(type) {
      case 'face_match': return '📷';
      case 'like': return '❤️';
      case 'comment': return '💬';
      case 'tag': return '🏷️';
      case 'favorite': return '⭐';
      default: return '🔔';
    }
  };

  const styles = {
    container: { minHeight: "100vh", backgroundColor: "#121212", color: "#ffffff", padding: "40px 20px", fontFamily: "sans-serif" },
    wrapper: { maxWidth: "1200px", margin: "0 auto" },
    header: { display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "30px", flexWrap: "wrap", gap: "15px" },
    title: { margin: 0, fontSize: "32px", color: "#ffffff" },
    markReadBtn: { padding: "8px 16px", backgroundColor: "rgba(105, 240, 174, 0.1)", color: "#69f0ae", border: "1px solid rgba(105, 240, 174, 0.3)", borderRadius: "8px", cursor: "pointer", fontWeight: "bold", transition: "0.2s" },
    card: (isRead) => ({ display: "flex", justifyContent: "space-between", alignItems: "center", backgroundColor: isRead ? "#1e1e1e" : "rgba(98, 0, 234, 0.08)", border: "1px solid #2a2a2a", borderRadius: "12px", padding: "20px", marginBottom: "15px", cursor: "pointer", transition: "0.2s" }),
    contentArea: { display: "flex", gap: "20px", alignItems: "center" },
    iconBox: { fontSize: "30px", backgroundColor: "#2c2c2c", width: "55px", height: "55px", borderRadius: "50%", display: "flex", justifyContent: "center", alignItems: "center", flexShrink: 0 },
    message: { margin: "0 0 8px 0", fontSize: "16px", color: "#ffffff", lineHeight: "1.4" },
    metaBox: { display: "flex", gap: "10px", alignItems: "center", fontSize: "13px", color: "#a0a0a0" },
    unreadDot: { width: "8px", height: "8px", backgroundColor: "#6200ea", borderRadius: "50%" },
    deleteBtn: { background: "none", border: "none", color: "#ff5252", cursor: "pointer", padding: "10px", borderRadius: "50%", transition: "0.2s", display: "flex", alignItems: "center" },
    emptyState: { textAlign: "center", padding: "80px 20px", backgroundColor: "#1e1e1e", borderRadius: "12px", border: "1px dashed #444", color: "#a0a0a0" }
  };

  if (loading) return <div style={{...styles.container, textAlign: "center", paddingTop: "100px"}}>Loading notifications...</div>;

  return (
    <div style={styles.container}>
      <div style={styles.wrapper}>
        
        {/* EXACT REFERENCE LAYOUT */}
        <div style={styles.header}>
          <div style={{ display: "flex", alignItems: "center", gap: "15px" }}>
            <DashboardBackButton />
            <h1 style={styles.title}>🔔 Notifications</h1>
          </div>
          
          {notifications.some(n => !n.read) && (
            <button 
              onClick={markAllAsRead} 
              style={styles.markReadBtn}
              onMouseOver={(e) => e.target.style.backgroundColor = "rgba(105, 240, 174, 0.2)"}
              onMouseOut={(e) => e.target.style.backgroundColor = "rgba(105, 240, 174, 0.1)"}
            >
              ✓ Mark all as read
            </button>
          )}
        </div>

        {notifications.length === 0 ? (
          <div style={styles.emptyState}>
            <div style={{ fontSize: "50px", marginBottom: "15px" }}>🔔</div>
            <h3 style={{ margin: "0 0 10px 0", color: "#ffffff" }}>No notifications yet</h3>
            <p style={{ margin: 0 }}>You're all caught up! New interactions will appear here.</p>
          </div>
        ) : (
          <div>
            {notifications.map(notif => (
              <div 
                key={notif.id} 
                style={styles.card(notif.read)}
                onClick={() => handleNotificationClick(notif)}
                onMouseOver={(e) => e.currentTarget.style.borderColor = "#444"}
                onMouseOut={(e) => e.currentTarget.style.borderColor = "#2a2a2a"}
              >
                <div style={styles.contentArea}>
                  <div style={styles.iconBox}>{getNotificationIcon(notif.type)}</div>
                  <div>
                    <p style={styles.message}>{notif.message}</p>
                    <div style={styles.metaBox}>
                      {!notif.read && <div style={styles.unreadDot} title="Unread"></div>}
                      <span>{formatTimeAgo(notif.createdAt)}</span>
                      {notif.mediaTitle && <span>• {notif.mediaTitle}</span>}
                    </div>
                  </div>
                </div>

                <button 
                  onClick={(e) => deleteNotification(e, notif.id)} 
                  style={styles.deleteBtn}
                  onMouseOver={(e) => e.currentTarget.style.backgroundColor = "rgba(244, 67, 54, 0.1)"}
                  onMouseOut={(e) => e.currentTarget.style.backgroundColor = "transparent"}
                  title="Delete Notification"
                >
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <polyline points="3 6 5 6 21 6"></polyline>
                    <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
                    <line x1="10" y1="11" x2="10" y2="17"></line>
                    <line x1="14" y1="11" x2="14" y2="17"></line>
                  </svg>
                </button>
              </div>
            ))}
          </div>
        )}

      </div>
    </div>
  );
}