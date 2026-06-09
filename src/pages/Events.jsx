// src/pages/Events.jsx

import React, { useState, useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { collection, getDocs } from "firebase/firestore";
import { db } from "../firebase";
import { useAuth } from "../context/AuthContext";

export default function Events() {
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [sortBy, setSortBy] = useState("Date");

  // State for Event Deletion Modal
  const [eventToDelete, setEventToDelete] = useState(null);
  const [isDeletingEvent, setIsDeletingEvent] = useState(false);

  // NEW: Smart Search State
  const [searchQuery, setSearchQuery] = useState("");

  const { userProfile, currentUser } = useAuth();
  const navigate = useNavigate();
  const isAdmin = userProfile?.role === "Admin";

  useEffect(() => {
    fetchEvents();
  }, []);

  const fetchEvents = async () => {
    try {
      setLoading(true);
      const eventsCollection = collection(db, "events");
      const eventSnapshot = await getDocs(eventsCollection);
      const eventList = eventSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setEvents(eventList);
    } catch (err) {
      console.error("Error fetching events:", err);
      setError("Failed to load events.");
    } finally {
      setLoading(false);
    }
  };

  const confirmDeleteEvent = async () => {
    if (!eventToDelete || !currentUser) return;
    
    setIsDeletingEvent(true);
    try {
      const res = await fetch(`http://localhost:5000/api/delete/event/${eventToDelete.id}`, {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ uid: currentUser.uid })
      });
      
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to delete event");
      
      alert(data.message || "Event and all associated media deleted successfully");
      
      setEvents(events.filter(event => event.id !== eventToDelete.id));
      setEventToDelete(null);
      
    } catch (err) {
      console.error(err);
      alert("Failed to delete event: " + err.message);
    } finally {
      setIsDeletingEvent(false);
    }
  };

  // NEW: Smart Search and Sorting Logic via useMemo
  const processedEvents = useMemo(() => {
    const query = searchQuery.toLowerCase().trim();
    
    // 1. Filter
    const filtered = events.filter(event => {
      if (!query) return true;
      const matchName = event.eventName?.toLowerCase().includes(query);
      const matchCategory = event.category?.toLowerCase().includes(query);
      const matchDesc = event.description?.toLowerCase().includes(query);
      return matchName || matchCategory || matchDesc;
    });

    // 2. Sort
    return filtered.sort((a, b) => {
      if (sortBy === "Name") return (a.eventName || "").localeCompare(b.eventName || "");
      if (sortBy === "Date") return new Date(a.eventDate) - new Date(b.eventDate);
      if (sortBy === "Category") return (a.category || "").localeCompare(b.category || "");
      return 0;
    });
  }, [events, searchQuery, sortBy]);

  const styles = {
    container: { minHeight: "100vh", backgroundColor: "#121212", color: "#ffffff", padding: "40px 20px", fontFamily: "sans-serif" },
    wrapper: { maxWidth: "1200px", margin: "0 auto" },
    header: { display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "30px", flexWrap: "wrap", gap: "15px" },
    title: { margin: 0, fontSize: "32px", color: "#ffffff" },
    controls: { display: "flex", gap: "15px", alignItems: "center" },
    select: { padding: "10px", borderRadius: "8px", border: "1px solid #444", backgroundColor: "#2c2c2c", color: "#ffffff", outline: "none", cursor: "pointer" },
    createBtn: { padding: "10px 20px", backgroundColor: "#6200ea", color: "#ffffff", border: "none", borderRadius: "8px", fontWeight: "bold", cursor: "pointer" },
    backBtn: { padding: "10px 20px", backgroundColor: "#2c2c2c", color: "#ffffff", border: "1px solid #444", borderRadius: "8px", cursor: "pointer" },
    
    // NEW: Search Styles
    searchSection: { backgroundColor: "#1e1e1e", padding: "20px", borderRadius: "12px", border: "1px solid #2a2a2a", marginBottom: "30px", display: "flex", flexDirection: "column", gap: "12px", boxShadow: "0 4px 12px rgba(0,0,0,0.2)" },
    searchInput: { width: "100%", padding: "16px 20px", borderRadius: "8px", border: "1px solid #444", backgroundColor: "#121212", color: "#fff", fontSize: "16px", outline: "none", boxSizing: "border-box" },
    resultCount: { color: "#69f0ae", fontSize: "14px", fontWeight: "bold" },
    searchEmptyState: { textAlign: "center", padding: "60px 20px", backgroundColor: "#1e1e1e", borderRadius: "12px", border: "1px dashed #444", marginTop: "20px" },
    searchEmptyText: { color: "#a0a0a0", fontSize: "16px", margin: "10px 0 0 0" },

    grid: { display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))", gap: "20px" },
    card: { backgroundColor: "#1e1e1e", borderRadius: "12px", border: "1px solid #2a2a2a", padding: "24px", display: "flex", flexDirection: "column", boxShadow: "0 4px 6px rgba(0,0,0,0.3)", position: "relative" },
    cardHeader: { display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "15px" },
    eventName: { margin: 0, fontSize: "20px", color: "#ffffff", flex: 1 },
    categoryBadge: { backgroundColor: "rgba(98, 0, 234, 0.2)", color: "#b388ff", padding: "4px 8px", borderRadius: "6px", fontSize: "12px", fontWeight: "bold", whiteSpace: "nowrap", marginLeft: "10px" },
    eventDate: { color: "#69f0ae", fontSize: "14px", marginBottom: "15px", fontWeight: "600" },
    description: { color: "#a0a0a0", fontSize: "14px", lineHeight: "1.5", flexGrow: 1, marginBottom: "20px" },
    adminControls: { display: "flex", gap: "10px", marginTop: "auto", borderTop: "1px solid #333", paddingTop: "15px" },
    editBtn: { padding: "8px 12px", backgroundColor: "rgba(33, 150, 243, 0.1)", color: "#64b5f6", border: "1px solid rgba(33, 150, 243, 0.3)", borderRadius: "6px", cursor: "pointer", flex: 1, fontWeight: "bold", transition: "0.2s" },
    deleteBtn: { padding: "8px 12px", backgroundColor: "rgba(244, 67, 54, 0.1)", color: "#ff5252", border: "1px solid rgba(244, 67, 54, 0.3)", borderRadius: "6px", cursor: "pointer", flex: 1, fontWeight: "bold", transition: "0.2s" },
    loading: { textAlign: "center", marginTop: "50px", color: "#a0a0a0", fontSize: "18px" },
    error: { backgroundColor: "rgba(244, 67, 54, 0.1)", color: "#ff5252", padding: "12px", borderRadius: "8px", marginBottom: "20px", textAlign: "center", border: "1px solid rgba(244, 67, 54, 0.3)" }
  };

  if (loading) return <div style={styles.container}><div style={styles.loading}>Loading events...</div></div>;

  return (
    <div style={styles.container}>
      <div style={styles.wrapper}>
        
        <div style={styles.header}>
          <div style={{ display: "flex", alignItems: "center", gap: "15px" }}>
            <button onClick={() => navigate("/dashboard")} style={styles.backBtn}>← Dashboard</button>
            <h1 style={styles.title}>Platform Events</h1>
          </div>
          
          <div style={styles.controls}>
            <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
              <span style={{ color: "#a0a0a0", fontSize: "14px" }}>Sort By:</span>
              <select value={sortBy} onChange={(e) => setSortBy(e.target.value)} style={styles.select}>
                <option value="Name">Event Name</option>
                <option value="Date">Date</option>
                <option value="Category">Category</option>
              </select>
            </div>
            {isAdmin && (
              <button onClick={() => navigate("/create-event")} style={styles.createBtn}>
                + Create Event
              </button>
            )}
          </div>
        </div>

        {error && <div style={styles.error}>{error}</div>}

        {/* SMART SEARCH BAR */}
        {events.length > 0 && (
          <div style={styles.searchSection}>
            <input 
              type="text" 
              placeholder="🔍 Search events by name, category, or description..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              style={styles.searchInput}
            />
            <div style={styles.resultCount}>
              {processedEvents.length} {processedEvents.length === 1 ? 'event' : 'events'} found
            </div>
          </div>
        )}

        {/* DB EMPTY STATE */}
        {events.length === 0 && !error && (
          <div style={{ textAlign: "center", color: "#a0a0a0", marginTop: "50px", padding: "40px", backgroundColor: "#1e1e1e", borderRadius: "12px", border: "1px solid #2a2a2a" }}>
            <h3>No events found.</h3>
            {isAdmin && <p>Click the "Create Event" button to add your first event.</p>}
          </div>
        )}

        {/* SEARCH EMPTY STATE */}
        {events.length > 0 && processedEvents.length === 0 && (
          <div style={styles.searchEmptyState}>
            <div style={{ fontSize: "40px" }}>🔍</div>
            <p style={styles.searchEmptyText}>No matching events found for "{searchQuery}".</p>
            <button 
              onClick={() => setSearchQuery("")} 
              style={{marginTop: "15px", padding: "8px 16px", backgroundColor: "#2c2c2c", color: "#fff", border: "1px solid #444", borderRadius: "6px", cursor: "pointer"}}
            >
              Clear Search
            </button>
          </div>
        )}

        {/* EVENT GRID */}
        {processedEvents.length > 0 && (
          <div style={styles.grid}>
            {processedEvents.map(event => (
              <div
                key={event.id}
                style={{ ...styles.card, cursor: "pointer" }}
                onClick={() => navigate(`/events/${event.id}`)}
                onMouseEnter={(e) => { e.currentTarget.style.transform = "translateY(-2px)"; e.currentTarget.style.boxShadow = "0 8px 15px rgba(0,0,0,0.5)"; }}
                onMouseLeave={(e) => { e.currentTarget.style.transform = "translateY(0)"; e.currentTarget.style.boxShadow = "0 4px 6px rgba(0,0,0,0.3)"; }}
              >
                <div style={styles.cardHeader}>
                  <h3 style={styles.eventName}>{event.eventName}</h3>
                  <span style={styles.categoryBadge}>{event.category}</span>
                </div>
                
                <div style={styles.eventDate}>📅 {new Date(event.eventDate).toLocaleDateString(undefined, { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</div>
                
                <p style={styles.description}>{event.description}</p>
                <div style={{ color: "#777", fontSize: "12px", marginBottom: "10px" }}>
                  Added by: {event.createdByName}
                </div>

                {isAdmin && (
                  <div style={styles.adminControls}>
                    <button 
                      onClick={(e) => {
                        e.stopPropagation();
                        alert(`Edit feature for ${event.eventName} will be implemented here.`);
                      }} 
                      style={styles.editBtn}
                      onMouseOver={(e) => e.target.style.backgroundColor = "rgba(33, 150, 243, 0.2)"}
                      onMouseOut={(e) => e.target.style.backgroundColor = "rgba(33, 150, 243, 0.1)"}
                    >
                      Edit
                    </button>
                    <button 
                      onClick={(e) => {
                        e.stopPropagation();
                        setEventToDelete(event);
                      }} 
                      style={styles.deleteBtn}
                      onMouseOver={(e) => e.target.style.backgroundColor = "rgba(244, 67, 54, 0.2)"}
                      onMouseOut={(e) => e.target.style.backgroundColor = "rgba(244, 67, 54, 0.1)"}
                    >
                      Delete
                    </button>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}

      </div>

      {/* EVENT DELETE CONFIRMATION MODAL */}
      {eventToDelete && (
        <div 
          onClick={() => !isDeletingEvent && setEventToDelete(null)}
          style={{ position: "fixed", top: 0, left: 0, width: "100vw", height: "100vh", backgroundColor: "rgba(0, 0, 0, 0.8)", zIndex: 10003, display: "flex", justifyContent: "center", alignItems: "center", backdropFilter: "blur(4px)" }}
        >
          <div 
            onClick={(e) => e.stopPropagation()}
            style={{ width: "90%", maxWidth: "450px", backgroundColor: "#1e1e1e", borderRadius: "12px", border: "1px solid #ff5252", display: "flex", flexDirection: "column", boxShadow: "0 15px 40px rgba(255,82,82,0.2)", padding: "24px" }}
          >
            <h3 style={{ margin: "0 0 15px 0", fontSize: "22px", color: "#ff5252", fontWeight: "bold", textAlign: "center" }}>Delete Event</h3>
            
            <p style={{ margin: "0 0 20px 0", fontSize: "16px", color: "#e0e0e0", lineHeight: "1.6" }}>
              You are about to delete <strong>{eventToDelete.eventName}</strong>. This will permanently delete:
            </p>
            <ul style={{ color: "#ff5252", paddingLeft: "20px", marginTop: "0", marginBottom: "20px", lineHeight: "1.8" }}>
              <li>The event details</li>
              <li>All photos in this event from AWS S3</li>
              <li>All videos in this event from AWS S3</li>
              <li>All associated comments and likes</li>
            </ul>
            <p style={{ margin: "0 0 20px 0", fontSize: "16px", color: "#e0e0e0", fontWeight: "bold", textAlign: "center" }}>
              This action cannot be undone.
            </p>

            <div style={{ display: "flex", gap: "15px" }}>
              <button 
                onClick={() => setEventToDelete(null)} 
                disabled={isDeletingEvent} 
                style={{ padding: "12px", backgroundColor: "#2c2c2c", color: "white", border: "none", borderRadius: "8px", cursor: "pointer", fontWeight: "bold", flex: 1 }}
              >
                Cancel
              </button>
              <button 
                onClick={confirmDeleteEvent} 
                disabled={isDeletingEvent} 
                style={{ padding: "12px", backgroundColor: "#ff5252", color: "white", border: "none", borderRadius: "8px", cursor: "pointer", fontWeight: "bold", flex: 1, opacity: isDeletingEvent ? 0.6 : 1 }}
              >
                {isDeletingEvent ? "Deleting..." : "Delete Event"}
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}