// src/pages/Dashboard.jsx

import React, { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { collection, query, where, onSnapshot, doc, updateDoc, writeBatch } from "firebase/firestore";
import { db } from "../firebase";
import { useAuth } from "../context/AuthContext";

export default function Dashboard() {
  const navigate = useNavigate();
  const { currentUser, userProfile, logout } = useAuth();
  
  const [unreadCount, setUnreadCount] = useState(0);
  const [unreadNotifications, setUnreadNotifications] = useState([]);
  const [recentNotifications, setRecentNotifications] = useState([]);
  const [showNotifications, setShowNotifications] = useState(false);
  const dropdownRef = useRef(null);

  const role = userProfile?.role || "Viewer";
  const isAdmin = role === "Admin";
  const isPhotographer = role === "Photographer";

  // Handle click outside to close the dropdown smoothly
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setShowNotifications(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Fetch Notifications in Real-time
  useEffect(() => {
    if (!currentUser) return;
    const q = query(
      collection(db, "notifications"),
      where("receiverId", "==", currentUser.uid)
    );
    
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const allNotifs = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      
      // Sort descending locally
      allNotifs.sort((a, b) => {
        const timeA = a.createdAt?.toMillis ? a.createdAt.toMillis() : 0;
        const timeB = b.createdAt?.toMillis ? b.createdAt.toMillis() : 0;
        return timeB - timeA;
      });

      const unreadItems = allNotifs.filter(n => !n.read);
      setUnreadNotifications(unreadItems);
      setUnreadCount(unreadItems.length);
      setRecentNotifications(allNotifs.slice(0, 5)); // Keep only top 5 for dropdown preview
    });
    
    return () => unsubscribe();
  }, [currentUser]);

  // FIXED: Navigate to Landing Page FIRST, then logout to escape the ProtectedRoute intercept
  const handleLogout = async () => {
    try {
      navigate("/", { replace: true });
      await logout();
    } catch (error) {
      console.error("Failed to log out", error);
    }
  };

  const handleNotificationClick = async (notif) => {
    setShowNotifications(false);
    
    // Mark as read in Firestore
    if (!notif.read) {
      try {
        await updateDoc(doc(db, "notifications", notif.id), { read: true });
      } catch (err) {
        console.error("Failed to mark notification as read", err);
      }
    }

    // Navigate to related content if IDs exist
    if (notif.eventId) {
      const targetUrl = notif.mediaId 
        ? `/events/${notif.eventId}?mediaId=${notif.mediaId}` 
        : `/events/${notif.eventId}`;
      navigate(targetUrl);
    }
  };

  // NEW: Mark all as read directly from the dropdown
  const markAllAsRead = async (e) => {
    e.stopPropagation();
    try {
      const batch = writeBatch(db);
      if (unreadNotifications.length === 0) return;

      unreadNotifications.forEach(n => {
        const ref = doc(db, "notifications", n.id);
        batch.update(ref, { read: true });
      });
      await batch.commit();
    } catch (err) {
      console.error("Error marking all as read:", err);
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
    header: { display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "40px", flexWrap: "wrap", gap: "15px" },
    welcome: { margin: 0, fontSize: "32px", color: "#ffffff" },
    roleBadge: { backgroundColor: "rgba(98, 0, 234, 0.2)", color: "#b388ff", padding: "6px 12px", borderRadius: "8px", fontSize: "14px", fontWeight: "bold", marginLeft: "15px", verticalAlign: "middle" },
    headerRight: { display: "flex", alignItems: "center", gap: "25px", position: "relative" },
    
    // Dropdown Styles
    bellContainer: { position: "relative", cursor: "pointer", display: "flex", alignItems: "center", color: "#a0a0a0", transition: "color 0.2s" },
    badge: { position: "absolute", top: "-5px", right: "-5px", backgroundColor: "#ff5252", color: "#ffffff", fontSize: "11px", fontWeight: "bold", padding: "2px 6px", borderRadius: "10px", border: "2px solid #121212" },
    dropdown: { position: "absolute", top: "45px", right: "0", width: "320px", backgroundColor: "#1e1e1e", borderRadius: "12px", border: "1px solid #2a2a2a", boxShadow: "0 15px 35px rgba(0,0,0,0.6)", zIndex: 100, overflow: "hidden", animation: "fadeIn 0.2s ease-out" },
    dropdownHeader: { padding: "15px", borderBottom: "1px solid #2a2a2a", color: "#ffffff", backgroundColor: "#242424", display: "flex", justifyContent: "space-between", alignItems: "center" },
    dropdownHeaderTitle: { fontWeight: "bold", fontSize: "16px", margin: 0 },
    markAllBtn: { background: "none", border: "none", color: "#69f0ae", fontSize: "12px", cursor: "pointer", fontWeight: "bold", padding: 0 },
    notifCard: (isRead) => ({ padding: "12px 15px", display: "flex", gap: "12px", cursor: "pointer", borderBottom: "1px solid #2a2a2a", backgroundColor: isRead ? "#1e1e1e" : "rgba(98, 0, 234, 0.08)", transition: "background 0.2s" }),
    notifIcon: { fontSize: "20px" },
    notifText: { margin: "0 0 5px 0", fontSize: "14px", color: "#ffffff", lineHeight: "1.4" },
    notifTime: { margin: 0, fontSize: "11px", color: "#a0a0a0" },
    viewAllBtn: { display: "block", width: "100%", padding: "12px", textAlign: "center", backgroundColor: "#242424", color: "#69f0ae", textDecoration: "none", fontWeight: "bold", fontSize: "14px", border: "none", cursor: "pointer", transition: "0.2s" },
    emptyDropdown: { padding: "30px 15px", textAlign: "center", color: "#a0a0a0", fontSize: "14px" },

    logoutBtn: { padding: "10px 20px", backgroundColor: "#ff5252", color: "#ffffff", border: "none", borderRadius: "8px", fontWeight: "bold", cursor: "pointer", transition: "0.2s" },
    grid: { display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", gap: "20px" },
    card: { backgroundColor: "#1e1e1e", borderRadius: "12px", border: "1px solid #2a2a2a", padding: "24px", display: "flex", flexDirection: "column", boxShadow: "0 4px 6px rgba(0,0,0,0.3)", cursor: "pointer", transition: "transform 0.2s ease, box-shadow 0.2s ease" },
    cardTitle: { margin: "0 0 10px 0", fontSize: "20px", color: "#ffffff" },
    cardDesc: { color: "#a0a0a0", fontSize: "14px", lineHeight: "1.5", margin: 0 }
  };

  const handleMouseEnter = (e) => { e.currentTarget.style.transform = "translateY(-4px)"; e.currentTarget.style.boxShadow = "0 8px 15px rgba(0,0,0,0.5)"; };
  const handleMouseLeave = (e) => { e.currentTarget.style.transform = "translateY(0)"; e.currentTarget.style.boxShadow = "0 4px 6px rgba(0,0,0,0.3)"; };

  const bellIcon = (
    <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"></path>
      <path d="M13.73 21a2 2 0 0 1-3.46 0"></path>
    </svg>
  );

  return (
    <div style={styles.container}>
      <style>{`@keyframes fadeIn { from { opacity: 0; transform: translateY(-10px); } to { opacity: 1; transform: translateY(0); } }`}</style>
      <div style={styles.wrapper}>
        
        <div style={styles.header}>
          <div>
            <h1 style={styles.welcome}>
              Welcome, {userProfile?.name || "User"}!
              <span style={styles.roleBadge}>{role}</span>
            </h1>
          </div>
          
          <div style={styles.headerRight} ref={dropdownRef}>
            {/* NOTIFICATION BELL WITH DROPDOWN */}
            <div 
              style={styles.bellContainer} 
              onClick={() => setShowNotifications(!showNotifications)}
              onMouseOver={(e) => e.currentTarget.style.color = "#ffffff"}
              onMouseOut={(e) => e.currentTarget.style.color = showNotifications ? "#ffffff" : "#a0a0a0"}
            >
              {bellIcon}
              {unreadCount > 0 && (
                <span style={styles.badge}>{unreadCount > 99 ? "99+" : unreadCount}</span>
              )}
            </div>

            {showNotifications && (
              <div style={styles.dropdown}>
                <div style={styles.dropdownHeader}>
                  <p style={styles.dropdownHeaderTitle}>Notifications</p>
                  {unreadCount > 0 && (
                    <button 
                      style={styles.markAllBtn} 
                      onClick={markAllAsRead}
                      onMouseOver={(e) => e.target.style.color = "#ffffff"}
                      onMouseOut={(e) => e.target.style.color = "#69f0ae"}
                    >
                      ✓ Mark all read
                    </button>
                  )}
                </div>
                
                {recentNotifications.length === 0 ? (
                  <div style={styles.emptyDropdown}>You have no notifications yet.</div>
                ) : (
                  recentNotifications.map(notif => (
                    <div 
                      key={notif.id} 
                      style={styles.notifCard(notif.read)}
                      onClick={() => handleNotificationClick(notif)}
                      onMouseOver={(e) => !notif.read && (e.currentTarget.style.backgroundColor = "rgba(98, 0, 234, 0.15)")}
                      onMouseOut={(e) => !notif.read && (e.currentTarget.style.backgroundColor = "rgba(98, 0, 234, 0.08)")}
                    >
                      <div style={styles.notifIcon}>{getNotificationIcon(notif.type)}</div>
                      <div>
                        <p style={styles.notifText}>{notif.message}</p>
                        <p style={styles.notifTime}>
                          {!notif.read && <span style={{ color: "#6200ea", fontWeight: "bold", marginRight: "5px" }}>•</span>}
                          {formatTimeAgo(notif.createdAt)}
                        </p>
                      </div>
                    </div>
                  ))
                )}

                <button 
                  style={styles.viewAllBtn} 
                  onClick={() => navigate("/notifications")}
                  onMouseOver={(e) => e.target.style.backgroundColor = "#333"}
                  onMouseOut={(e) => e.target.style.backgroundColor = "#242424"}
                >
                  View All Notifications →
                </button>
              </div>
            )}

            <button 
              onClick={handleLogout} 
              style={styles.logoutBtn}
              onMouseOver={(e) => e.target.style.backgroundColor = "rgba(244, 67, 54, 0.8)"}
              onMouseOut={(e) => e.target.style.backgroundColor = "#ff5252"}
            >
              Logout
            </button>
          </div>
        </div>

        {/* DASHBOARD GRID */}
        <div style={styles.grid}>
          <div style={styles.card} onClick={() => navigate("/events")} onMouseEnter={handleMouseEnter} onMouseLeave={handleMouseLeave}>
            <h3 style={styles.cardTitle}>📅 Events & Media</h3>
            <p style={styles.cardDesc}>Browse event galleries, search photos, and download memories.</p>
          </div>

          <div style={styles.card} onClick={() => navigate("/my-photos")} onMouseEnter={handleMouseEnter} onMouseLeave={handleMouseLeave}>
            <h3 style={styles.cardTitle}>🤖 My Smart Photos</h3>
            <p style={styles.cardDesc}>View all event photos where AI recognized your face.</p>
          </div>

          <div style={styles.card} onClick={() => navigate("/favorites")} onMouseEnter={handleMouseEnter} onMouseLeave={handleMouseLeave}>
            <h3 style={styles.cardTitle}>⭐ My Favorites</h3>
            <p style={styles.cardDesc}>Access all the photos and videos you have saved.</p>
          </div>

          <div style={styles.card} onClick={() => navigate("/profile")} onMouseEnter={handleMouseEnter} onMouseLeave={handleMouseLeave}>
            <h3 style={styles.cardTitle}>👤 My Profile</h3>
            <p style={styles.cardDesc}>Update your details and upload your reference selfie for Face Recognition.</p>
          </div>

          {(isAdmin || isPhotographer) && (
            <div style={styles.card} onClick={() => navigate("/upload")} onMouseEnter={handleMouseEnter} onMouseLeave={handleMouseLeave}>
              <h3 style={styles.cardTitle}>☁️ Upload Media</h3>
              <p style={styles.cardDesc}>Upload photos and videos for events. Bulk upload supported.</p>
            </div>
          )}

          {isAdmin && (
            <div style={styles.card} onClick={() => navigate("/create-event")} onMouseEnter={handleMouseEnter} onMouseLeave={handleMouseLeave}>
              <h3 style={styles.cardTitle}>➕ Create Event</h3>
              <p style={styles.cardDesc}>Schedule and set up new events for the club.</p>
            </div>
          )}

          {isAdmin && (
            <div style={styles.card} onClick={() => navigate("/admin")} onMouseEnter={handleMouseEnter} onMouseLeave={handleMouseLeave}>
              <h3 style={styles.cardTitle}>👥 User Management</h3>
              <p style={styles.cardDesc}>Manage platform users, roles, and club memberships.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}