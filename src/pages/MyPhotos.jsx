// src/pages/MyPhotos.jsx

import React, { useState, useEffect } from "react";
import { collection, query, where, onSnapshot, doc, updateDoc, arrayUnion, arrayRemove } from "firebase/firestore";
import { db } from "../firebase";
import { useAuth } from "../context/AuthContext";
import { useNavigate } from "react-router-dom";
import DashboardBackButton from "../components/DashboardBackButton";

export default function MyPhotos() {
  const { currentUser } = useAuth();
  const navigate = useNavigate();
  const [photos, setPhotos] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!currentUser) return;
    const q = query(
      collection(db, "media"), 
      where("matchedUsers", "array-contains", currentUser.uid)
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const fetchedPhotos = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      const onlyImages = fetchedPhotos.filter(p => !p.mediaType?.startsWith("video"));
      setPhotos(onlyImages);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [currentUser]);

  const toggleLike = async (mediaId, currentLikes = []) => {
    const isLiked = currentLikes.includes(currentUser.uid);
    const mediaRef = doc(db, "media", mediaId);
    try {
      if (isLiked) {
        await updateDoc(mediaRef, { likes: arrayRemove(currentUser.uid) });
      } else {
        await updateDoc(mediaRef, { likes: arrayUnion(currentUser.uid) });
      }
    } catch (err) {
      console.error("Error toggling like:", err);
    }
  };

  const toggleFavorite = async (mediaId, currentFavorites = []) => {
    const isFav = currentFavorites.includes(currentUser.uid);
    const mediaRef = doc(db, "media", mediaId);
    try {
      if (isFav) {
        await updateDoc(mediaRef, { favorites: arrayRemove(currentUser.uid) });
      } else {
        await updateDoc(mediaRef, { favorites: arrayUnion(currentUser.uid) });
      }
    } catch (err) {
      console.error("Error toggling favorite:", err);
    }
  };

  const openComments = (item) => {
  if (item.eventId) {
    navigate(
      `/events/${item.eventId}?mediaId=${item.id}&source=myPhotos`
    );
  }
};

  const styles = {
    container: { minHeight: "100vh", backgroundColor: "#121212", color: "#ffffff", padding: "40px 20px", fontFamily: "sans-serif" },
    wrapper: { maxWidth: "1200px", margin: "0 auto" },
    header: { display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "30px", flexWrap: "wrap", gap: "15px" },
    title: { margin: 0, fontSize: "32px", color: "#ffffff" },
    grid: { display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(250px, 1fr))", gap: "20px" },
    mediaCard: { backgroundColor: "#1e1e1e", borderRadius: "8px", overflow: "hidden", border: "1px solid #2a2a2a", display: "flex", flexDirection: "column" },
    image: { width: "100%", height: "250px", objectFit: "cover", backgroundColor: "#2c2c2c", cursor: "pointer" },
    mediaInfo: { padding: "15px", flexGrow: 1 },
    eventName: { fontSize: "12px", color: "#b388ff", fontWeight: "bold", textTransform: "uppercase", marginBottom: "5px" },
    interactionBar: { display: "flex", justifyContent: "space-between", alignItems: "center", borderTop: "1px solid #2a2a2a", padding: "12px 15px", backgroundColor: "#1a1a1a" },
    actionBtn: { background: "none", border: "none", color: "#ffffff", fontSize: "14px", cursor: "pointer", display: "flex", alignItems: "center", gap: "6px", transition: "0.2s" },
    emptyState: { textAlign: "center", padding: "50px", backgroundColor: "#1e1e1e", borderRadius: "12px", border: "1px dashed #444", color: "#a0a0a0" },
  };

  if (loading) return <div style={{...styles.container, textAlign: "center", paddingTop: "100px"}}>Scanning for your face...</div>;

  return (
    <div style={styles.container}>
      <div style={styles.wrapper}>
        
        {/* EXACT REFERENCE LAYOUT */}
        <div style={styles.header}>
          <div style={{ display: "flex", alignItems: "center", gap: "15px" }}>
            <DashboardBackButton />
            <h1 style={styles.title}>🤖 My Smart Photos</h1>
          </div>
        </div>

        <p style={{ color: "#a0a0a0", marginBottom: "30px", fontSize: "16px" }}>These are all the event photos where our AI recognized your face.</p>

        {photos.length === 0 ? (
          <div style={styles.emptyState}>
            <div style={{ fontSize: "40px", marginBottom: "10px" }}>🕵️‍♂️</div>
            <h3>No photos found yet.</h3>
            <p>Ensure you have uploaded a Reference Selfie in your Profile.</p>
          </div>
        ) : (
          <div style={styles.grid}>
            {photos.map(item => {
              const isLiked = item.likes?.includes(currentUser.uid);
              const isFav = item.favorites?.includes(currentUser.uid);
              const likeCount = item.likes?.length || 0;
              const commentCount = item.comments?.length || 0;

              return (
                <div key={item.id} style={styles.mediaCard}>
                  <img 
                    src={item.mediaUrl} 
                    alt={item.title} 
                    style={styles.image} 
                    loading="lazy" 
                    onClick={() => openComments(item)}
                  />
                  <div style={styles.mediaInfo}>
                    <div style={styles.eventName}>{item.eventName || "Event"}</div>
                    <p style={{ margin: 0, fontWeight: "bold", textOverflow: "ellipsis", overflow: "hidden", whiteSpace: "nowrap" }}>
                      {item.title}
                    </p>
                    <p style={{ margin: "5px 0 0 0", fontSize: "12px", color: "#777" }}>
                      Uploaded by {item.uploadedByName}
                    </p>
                  </div>

                  {/* INTERACTION BAR */}
                  <div style={styles.interactionBar}>
                    <button 
                      onClick={() => toggleLike(item.id, item.likes)} 
                      style={{ ...styles.actionBtn, color: isLiked ? "#ff5252" : "#ffffff" }}
                    >
                      {isLiked ? "❤️" : "🤍"} {likeCount}
                    </button>
                    
                    <button 
                      onClick={() => openComments(item)} 
                      style={styles.actionBtn}
                    >
                      💬 {commentCount}
                    </button>
                    
                    <button 
                      onClick={() => toggleFavorite(item.id, item.favorites)} 
                      style={{ ...styles.actionBtn, color: isFav ? "#ffd700" : "#ffffff" }}
                    >
                      {isFav ? "⭐" : "☆"} Save
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}

      </div>
    </div>
  );
}