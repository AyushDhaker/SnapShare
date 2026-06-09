// src/pages/MyFavorites.jsx

import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { doc, collection, query, where, onSnapshot, updateDoc, arrayUnion, arrayRemove, increment, addDoc, serverTimestamp } from "firebase/firestore";
import { db } from "../firebase";
import { useAuth } from "../context/AuthContext";
import TagUsersModal from "../components/TagUsersModal"; 

export default function MyFavorites() {
  const navigate = useNavigate();
  const { userProfile, currentUser } = useAuth();
  
  const [media, setMedia] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [lightboxData, setLightboxData] = useState({ index: 0 });
  
  const [commentPanelId, setCommentPanelId] = useState(null);
  const [commentText, setCommentText] = useState("");

  // Synchronized States from EventDetails
  const [shareModalOpen, setShareModalOpen] = useState(false);
  const [shareMediaItem, setShareMediaItem] = useState(null);

  const [tagModalOpen, setTagModalOpen] = useState(false);
  const [tagMediaItem, setTagMediaItem] = useState(null);

  const [viewTagsModalOpen, setViewTagsModalOpen] = useState(false);
  const [viewTagsMediaItem, setViewTagsMediaItem] = useState(null);
  const [viewTaggedUsersModalOpen, setViewTaggedUsersModalOpen] = useState(false);
  const [viewTaggedUsersMediaItem, setViewTaggedUsersMediaItem] = useState(null);

  const [isDownloading, setIsDownloading] = useState(false);

  const [mediaToDelete, setMediaToDelete] = useState(null);
  const [isDeletingMedia, setIsDeletingMedia] = useState(false);

  const role = userProfile?.role;
  const canViewPrivate = ["ClubMember", "Photographer", "Admin"].includes(role);

  useEffect(() => {
    if (!currentUser) return;
    
    // Query: Only fetch media where the current user's UID is in the favorites array
    const mediaQuery = query(collection(db, "media"), where("favorites", "array-contains", currentUser.uid));
    
    const unsubscribe = onSnapshot(mediaQuery, (snapshot) => {
      const favs = [];
      snapshot.forEach((docSnap) => {
        const item = { id: docSnap.id, ...docSnap.data() };
        // Enforce RBAC just in case they favorited a private image and were later demoted
        if (item.visibility === "Private" && !canViewPrivate) return;
        favs.push(item);
      });
      setMedia(favs);
      setLoading(false);
    }, (err) => {
      console.error("Error fetching favorites:", err);
      setError("Failed to load favorites data.");
      setLoading(false);
    });
    
    return () => unsubscribe();
  }, [currentUser, canViewPrivate]);

  const activeCommentMedia = media.find(m => m.id === commentPanelId) || null;
  const currentLightboxMedia = lightboxOpen && media.length > 0 ? media[lightboxData.index] : null;

  // --- Synchronized Handlers ---

  const confirmDeleteMedia = async () => {
    if (!mediaToDelete || !currentUser) return;
    setIsDeletingMedia(true);
    
    try {
      const response = await fetch(`http://localhost:5000/api/delete/media/${mediaToDelete.id}`, {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ uid: currentUser.uid })
      });
      
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Failed to delete media");
      
      setMediaToDelete(null);
      alert("Media deleted successfully!");

      if (lightboxOpen && currentLightboxMedia?.id === mediaToDelete.id) {
        closeLightbox();
      }

    } catch (err) {
      console.error(err);
      alert("Error: " + err.message);
    } finally {
      setIsDeletingMedia(false);
    }
  };

  const handleLikeToggle = async (e, item) => {
    if (e) e.stopPropagation();
    if (!currentUser) return; 
    const mediaRef = doc(db, "media", item.id);
    const hasLiked = item.likes && item.likes.includes(currentUser.uid);
    try {
      if (hasLiked) {
        await updateDoc(mediaRef, { likes: arrayRemove(currentUser.uid), likesCount: increment(-1) });
      } else {
        await updateDoc(mediaRef, { likes: arrayUnion(currentUser.uid), likesCount: increment(1) });
        if (item.uploadedBy && item.uploadedBy !== currentUser.uid) {
          await addDoc(collection(db, "notifications"), {
            receiverId: item.uploadedBy, senderId: currentUser.uid, senderName: userProfile?.name || "User",
            type: "like", mediaId: item.id, mediaTitle: item.title || "media", eventId: item.eventId || "unknown",
            message: `${userProfile?.name || "User"} liked your photo`, read: false, createdAt: serverTimestamp()
          });
        }
      }
    } catch (error) { console.error("Error toggling like:", error); }
  };

  const handleFavoriteToggle = async (e, item) => {
    if (e) e.stopPropagation();
    if (!currentUser) return; 
    const mediaRef = doc(db, "media", item.id);
    const hasFavorited = item.favorites && item.favorites.includes(currentUser.uid);
    try {
      if (hasFavorited) {
        await updateDoc(mediaRef, { favorites: arrayRemove(currentUser.uid), favoritesCount: increment(-1) });
        // Optional safety: close lightbox if we un-favorite the item we are currently viewing
        if (lightboxOpen && currentLightboxMedia?.id === item.id) {
           closeLightbox();
        }
      } else {
        await updateDoc(mediaRef, { favorites: arrayUnion(currentUser.uid), favoritesCount: increment(1) });
      }
    } catch (error) { console.error("Error toggling favorite:", error); }
  };

  const handleAddComment = async (e) => {
    e.preventDefault();
    if (!commentText.trim() || !currentUser || !activeCommentMedia) return;
    try {
      const mediaRef = doc(db, "media", activeCommentMedia.id);
      await updateDoc(mediaRef, {
        comments: arrayUnion({
          id: Date.now().toString(), 
          userId: currentUser.uid,
          userName: userProfile?.name || "User",
          text: commentText.trim(),
          createdAt: new Date().toISOString()
        }),
        commentsCount: increment(1)
      });
      if (activeCommentMedia.uploadedBy && activeCommentMedia.uploadedBy !== currentUser.uid) {
        await addDoc(collection(db, "notifications"), {
          receiverId: activeCommentMedia.uploadedBy, senderId: currentUser.uid, senderName: userProfile?.name || "User",
          type: "comment", mediaId: activeCommentMedia.id, mediaTitle: activeCommentMedia.title || "media",
          eventId: activeCommentMedia.eventId || "unknown", message: `${userProfile?.name || "User"} commented on your upload`, read: false, createdAt: serverTimestamp()
        });
      }
      setCommentText("");
    } catch (error) { console.error("Error adding comment:", error); }
  };

  const openCommentPanel = (e, mediaId) => {
    if (e) e.stopPropagation(); setCommentPanelId(mediaId); setCommentText("");
  };
  const closeCommentPanel = (e) => { if (e) e.stopPropagation(); setCommentPanelId(null); };
  
  const openShareModal = (e, item) => { if (e) e.stopPropagation(); setShareMediaItem(item); setShareModalOpen(true); };
  const closeShareModal = (e) => { if (e) e.stopPropagation(); setShareModalOpen(false); setShareMediaItem(null); };

  const handleCopyLink = async () => {
    const link = `http://localhost:5173/events/${shareMediaItem?.eventId}?mediaId=${shareMediaItem?.id || ""}`;
    try { await navigator.clipboard.writeText(link); alert("Link copied successfully"); } 
    catch (err) { console.error("Failed to copy link", err); }
  };

  const openTagModal = (e, item) => { if (e) e.stopPropagation(); setTagMediaItem(item); setTagModalOpen(true); };
  const closeTagModal = () => { setTagModalOpen(false); setTagMediaItem(null); };

  const openViewTagsModal = (e, item) => { if (e) e.stopPropagation(); setViewTagsMediaItem(item); setViewTagsModalOpen(true); };
  const closeViewTagsModal = () => { setViewTagsModalOpen(false); setViewTagsMediaItem(null); };

  const openViewTaggedUsersModal = (e, item) => { if (e) e.stopPropagation(); setViewTaggedUsersMediaItem(item); setViewTaggedUsersModalOpen(true); };
  const closeViewTaggedUsersModal = () => { setViewTaggedUsersModalOpen(false); setViewTaggedUsersMediaItem(null); };

  const handleSaveTags = async (mediaId, selectedUsers) => {
    try {
      const mediaRef = doc(db, "media", mediaId);
      await updateDoc(mediaRef, { taggedUsers: selectedUsers });
      const oldTags = tagMediaItem.taggedUsers || [];
      const newTags = selectedUsers.filter(newUser => !oldTags.some(oldUser => oldUser.uid === newUser.uid));

      for (const user of newTags) {
        if (user.uid !== currentUser.uid) {
          await addDoc(collection(db, "notifications"), {
            receiverId: user.uid, senderId: currentUser.uid, senderName: userProfile?.name || "User",
            type: "tag", mediaId: mediaId, mediaTitle: tagMediaItem?.title || "media", eventId: tagMediaItem?.eventId || "unknown",
            message: `${userProfile?.name || "User"} tagged you in a photo`, read: false, createdAt: serverTimestamp()
          });
        }
      }
    } catch (err) { console.error("Error updating tags:", err); }
  };

  // Advanced Watermarked Download
  const handleDownload = async (e) => {
    if (e) e.stopPropagation(); 
    if (!currentLightboxMedia || isDownloading) return;
    try {
      setIsDownloading(true);
      const isVideo = currentLightboxMedia.mediaType && currentLightboxMedia.mediaType.startsWith("video");
      const cacheBustedUrl = `${currentLightboxMedia.mediaUrl}?t=${new Date().getTime()}`;

      const response = await fetch(cacheBustedUrl);
      if (!response.ok) throw new Error("Network response was not ok");
      
      const blob = await response.blob();
      let finalBlob = blob; 

      if (!isVideo) {
        try {
          finalBlob = await new Promise((resolve, reject) => {
            const img = new Image();
            const objectUrl = URL.createObjectURL(blob);
            
            img.onload = () => {
              try {
                const canvas = document.createElement("canvas");
                canvas.width = img.width; canvas.height = img.height;
                const ctx = canvas.getContext("2d");
                
                ctx.drawImage(img, 0, 0);

                ctx.save();
                ctx.translate(img.width / 2, img.height / 2);
                ctx.rotate(-30 * Math.PI / 180); 
                const centerFontSize = Math.floor(img.width * 0.18);
                ctx.font = `bold ${centerFontSize}px sans-serif`;
                ctx.textAlign = "center"; ctx.textBaseline = "middle";
                ctx.fillStyle = "rgba(255, 255, 255, 0.08)";
                ctx.fillText("SNAPSPHERE", 0, 0);
                ctx.restore();

                const category = currentLightboxMedia.category || "General";
                const role = userProfile?.role || "Viewer";
                const evtName = currentLightboxMedia.eventName || "Event";

                const line1 = "SNAPSPHERE";
                const line2 = `${category} \u2022 ${role}`; 
                const line3 = `Event: ${evtName}`;

                let titleSize = Math.max(16, Math.floor(img.width * 0.025));
                let subSize = Math.max(12, Math.floor(img.width * 0.015));
                let padding = Math.max(10, Math.floor(img.width * 0.015));
                let gap = Math.max(4, Math.floor(img.width * 0.005));

                ctx.font = `bold ${titleSize}px sans-serif`;
                let w1 = ctx.measureText(line1).width;
                ctx.font = `${subSize}px sans-serif`;
                let w2 = ctx.measureText(line2).width;
                let w3 = ctx.measureText(line3).width;

                let boxW = Math.max(w1, w2, w3) + (padding * 2);
                let boxH = titleSize + (subSize * 2) + (gap * 2) + (padding * 2);

                const maxBoxW = img.width * 0.22; const maxBoxH = img.height * 0.12;
                const scaleW = boxW > maxBoxW ? maxBoxW / boxW : 1;
                const scaleH = boxH > maxBoxH ? maxBoxH / boxH : 1;
                const scale = Math.min(scaleW, scaleH);

                if (scale < 1) {
                  titleSize *= scale; subSize *= scale; padding *= scale; gap *= scale;
                  ctx.font = `bold ${titleSize}px sans-serif`; w1 = ctx.measureText(line1).width;
                  ctx.font = `${subSize}px sans-serif`; w2 = ctx.measureText(line2).width; w3 = ctx.measureText(line3).width;
                  boxW = Math.max(w1, w2, w3) + (padding * 2); boxH = titleSize + (subSize * 2) + (gap * 2) + (padding * 2);
                }

                const marginX = img.width * 0.02; const marginY = img.height * 0.02;
                const boxX = img.width - boxW - marginX; const boxY = img.height - boxH - marginY;

                const radius = Math.max(4, padding * 0.5);
                ctx.beginPath();
                ctx.moveTo(boxX + radius, boxY);
                ctx.lineTo(boxX + boxW - radius, boxY);
                ctx.quadraticCurveTo(boxX + boxW, boxY, boxX + boxW, boxY + radius);
                ctx.lineTo(boxX + boxW, boxY + boxH - radius);
                ctx.quadraticCurveTo(boxX + boxW, boxY + boxH, boxX + boxW - radius, boxY + boxH);
                ctx.lineTo(boxX + radius, boxY + boxH);
                ctx.quadraticCurveTo(boxX, boxY + boxH, boxX, boxY + boxH - radius);
                ctx.lineTo(boxX, boxY + radius);
                ctx.quadraticCurveTo(boxX, boxY, boxX + radius, boxY);
                ctx.closePath();
                
                ctx.fillStyle = "rgba(0, 0, 0, 0.55)"; ctx.fill();

                ctx.shadowColor = "rgba(0, 0, 0, 0.85)"; ctx.shadowBlur = Math.max(2, titleSize * 0.2);
                ctx.shadowOffsetX = 1; ctx.shadowOffsetY = 1; ctx.fillStyle = "#ffffff";
                ctx.textAlign = "left"; ctx.textBaseline = "top";

                let currentY = boxY + padding;
                ctx.font = `bold ${titleSize}px sans-serif`; ctx.fillText(line1, boxX + padding, currentY); currentY += titleSize + gap;
                ctx.font = `${subSize}px sans-serif`; ctx.fillText(line2, boxX + padding, currentY); currentY += subSize + gap;
                ctx.fillText(line3, boxX + padding, currentY);

                canvas.toBlob((watermarkedBlob) => {
                  if (watermarkedBlob) resolve(watermarkedBlob);
                  else reject(new Error("Canvas toBlob failed"));
                }, currentLightboxMedia.mediaType || "image/jpeg", 0.98);

              } catch (err) { reject(err); } finally { URL.revokeObjectURL(objectUrl); }
            };
            img.onerror = () => { URL.revokeObjectURL(objectUrl); reject(new Error("Image load failed for watermarking")); };
            img.crossOrigin = "Anonymous"; img.src = objectUrl;
          });
        } catch (watermarkError) {
          console.warn("Watermarking failed, safely falling back to original image:", watermarkError);
        }
      }

      const downloadUrl = window.URL.createObjectURL(finalBlob);
      const link = document.createElement("a");
      link.href = downloadUrl;
      link.setAttribute("download", currentLightboxMedia.title || "downloaded-media");
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(downloadUrl);

    } catch (error) {
      console.error("Download failed:", error);
      alert("Failed to download media. Please ensure CORS is configured correctly.");
    } finally {
      setIsDownloading(false);
    }
  };

  // --- Keyboard & Lightbox ---
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (viewTagsModalOpen) { if (e.key === "Escape") closeViewTagsModal(); return; }
      if (viewTaggedUsersModalOpen) { if (e.key === "Escape") closeViewTaggedUsersModal(); return; }
      if (tagModalOpen) { if (e.key === "Escape") closeTagModal(); return; }
      if (shareModalOpen) { if (e.key === "Escape") closeShareModal(); return; }
      if (commentPanelId) { if (e.key === "Escape") closeCommentPanel(); return; }
      if (mediaToDelete) { if (e.key === "Escape") setMediaToDelete(null); return; }
      if (!lightboxOpen) return;
      if (e.key === "Escape") closeLightbox();
      if (e.target.tagName.toLowerCase() !== "input") {
        if (e.key === "ArrowRight") goNext();
        if (e.key === "ArrowLeft") goPrev();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [lightboxOpen, lightboxData, media, commentPanelId, shareModalOpen, tagModalOpen, mediaToDelete, viewTagsModalOpen, viewTaggedUsersModalOpen]);

  const openLightbox = (index) => {
    setLightboxData({ index });
    setLightboxOpen(true);
  };
  const closeLightbox = () => setLightboxOpen(false);
  
  const goNext = (e) => {
    if (e) e.stopPropagation();
    setLightboxData(prev => ({ index: prev.index === media.length - 1 ? 0 : prev.index + 1 }));
  };
  const goPrev = (e) => {
    if (e) e.stopPropagation();
    setLightboxData(prev => ({ index: prev.index === 0 ? media.length - 1 : prev.index - 1 }));
  };

  const formatTime = (isoString) => {
    const date = new Date(isoString);
    return date.toLocaleDateString() + " " + date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  // --- Styles (Matching Dark Theme) ---
  const styles = {
    container: { minHeight: "100vh", backgroundColor: "#121212", color: "#ffffff", padding: "40px 20px", fontFamily: "sans-serif" },
    wrapper: { maxWidth: "1200px", margin: "0 auto" },
    header: { backgroundColor: "#1e1e1e", padding: "30px", borderRadius: "12px", border: "1px solid #2a2a2a", marginBottom: "30px" },
    backBtn: { padding: "8px 16px", backgroundColor: "#2c2c2c", color: "#ffffff", border: "1px solid #444", borderRadius: "6px", cursor: "pointer", marginBottom: "20px" },
    title: { margin: "0 0 10px 0", fontSize: "32px", color: "#ffffff" },
    grid: { display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(250px, 1fr))", gap: "20px" },
    mediaCard: { backgroundColor: "#1e1e1e", borderRadius: "8px", overflow: "hidden", border: "1px solid #2a2a2a", transition: "transform 0.2s ease, box-shadow 0.2s ease", cursor: "pointer" },
    image: { width: "100%", height: "200px", objectFit: "cover", backgroundColor: "#2c2c2c", cursor: "pointer", transition: "opacity 0.2s" },
    mediaInfo: { padding: "15px" },
    emptyState: { padding: "40px", textAlign: "center", color: "#a0a0a0", backgroundColor: "#1e1e1e", borderRadius: "8px", border: "1px dashed #444", fontSize: "16px" },
    
    lightboxOverlay: { position: "fixed", top: 0, left: 0, width: "100vw", height: "100vh", backgroundColor: "rgba(0, 0, 0, 0.95)", zIndex: 9999, display: "flex", justifyContent: "center", alignItems: "center" },
    lightboxCloseBtn: { position: "absolute", top: "20px", right: "30px", background: "none", border: "none", color: "white", fontSize: "40px", cursor: "pointer", zIndex: 10000 },
    lightboxNavLeft: { position: "absolute", left: "20px", top: "50%", transform: "translateY(-50%)", background: "rgba(255, 255, 255, 0.1)", border: "none", color: "white", fontSize: "30px", cursor: "pointer", padding: "15px", borderRadius: "50%", zIndex: 10000, transition: "background 0.2s" },
    lightboxNavRight: { position: "absolute", right: "20px", top: "50%", transform: "translateY(-50%)", background: "rgba(255, 255, 255, 0.1)", border: "none", color: "white", fontSize: "30px", cursor: "pointer", padding: "15px", borderRadius: "50%", zIndex: 10000, transition: "background 0.2s" },
    lightboxContentWrapper: { position: "relative", maxWidth: "90vw", maxHeight: "85vh", display: "flex", flexDirection: "column", alignItems: "center" },
    lightboxImage: { maxWidth: "100%", maxHeight: "70vh", objectFit: "contain", borderRadius: "8px", boxShadow: "0 10px 30px rgba(0,0,0,0.5)" },
    lightboxVideo: { maxWidth: "100%", maxHeight: "70vh", borderRadius: "8px", boxShadow: "0 10px 30px rgba(0,0,0,0.5)", backgroundColor: "#000" },
    lightboxCaption: { color: "#ffffff", marginTop: "15px", fontSize: "16px", fontWeight: "bold", textAlign: "center", textShadow: "0 2px 4px rgba(0,0,0,0.8)" },
    lightboxBtn: { padding: "10px 20px", backgroundColor: "#2c2c2c", color: "#ffffff", border: "1px solid #444", borderRadius: "6px", cursor: "pointer", fontWeight: "bold", fontSize: "14px", transition: "all 0.2s ease", display: "flex", alignItems: "center", gap: "8px" },
    
    commentOverlay: { position: "fixed", top: 0, left: 0, width: "100vw", height: "100vh", backgroundColor: "rgba(0, 0, 0, 0.7)", zIndex: 10001, display: "flex", justifyContent: "center", alignItems: "center", backdropFilter: "blur(2px)" },
    commentModal: { width: "90%", maxWidth: "450px", maxHeight: "85vh", backgroundColor: "#1e1e1e", borderRadius: "12px", border: "1px solid #333", display: "flex", flexDirection: "column", boxShadow: "0 15px 40px rgba(0,0,0,0.6)", overflow: "hidden" },
    commentHeader: { display: "flex", justifyContent: "space-between", alignItems: "center", padding: "15px 20px", borderBottom: "1px solid #2a2a2a", backgroundColor: "#242424" },
    commentTitle: { margin: 0, fontSize: "18px", color: "#ffffff", fontWeight: "bold" },
    commentCloseIcon: { background: "none", border: "none", color: "#a0a0a0", fontSize: "28px", cursor: "pointer", padding: 0, lineHeight: "1" },
    commentList: { flex: 1, overflowY: "auto", padding: "20px", backgroundColor: "#121212" },
    commentCard: { backgroundColor: "#2c2c2c", borderRadius: "10px", padding: "12px 15px", marginBottom: "12px", border: "1px solid #333" },
    commentHeaderRow: { display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "6px" },
    commentName: { margin: 0, fontSize: "14px", fontWeight: "bold", color: "#69f0ae" },
    commentDate: { margin: 0, fontSize: "11px", color: "#777" },
    commentText: { margin: 0, fontSize: "14px", color: "#e0e0e0", lineHeight: "1.5" },
    commentInputArea: { padding: "15px 20px", borderTop: "1px solid #2a2a2a", backgroundColor: "#1e1e1e", display: "flex", gap: "10px" },
    commentInput: { flex: 1, padding: "12px", borderRadius: "8px", border: "1px solid #444", backgroundColor: "#2c2c2c", color: "white", outline: "none", fontSize: "14px" },
    commentSubmitBtn: { padding: "10px 20px", backgroundColor: "#6200ea", color: "white", border: "none", borderRadius: "8px", cursor: "pointer", fontWeight: "bold", transition: "opacity 0.2s" },

    shareOverlay: { position: "fixed", top: 0, left: 0, width: "100vw", height: "100vh", backgroundColor: "rgba(0, 0, 0, 0.7)", zIndex: 10002, display: "flex", justifyContent: "center", alignItems: "center", backdropFilter: "blur(2px)" },
    shareModal: { width: "90%", maxWidth: "400px", backgroundColor: "#1e1e1e", borderRadius: "12px", border: "1px solid #333", display: "flex", flexDirection: "column", boxShadow: "0 15px 40px rgba(0,0,0,0.6)", overflow: "hidden", padding: "20px" },
    shareHeader: { display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "15px" },
    shareTitle: { margin: 0, fontSize: "18px", color: "#ffffff", fontWeight: "bold" },
    shareCloseIcon: { background: "none", border: "none", color: "#a0a0a0", fontSize: "28px", cursor: "pointer", padding: 0, lineHeight: "1" },
    sharePreview: { display: "flex", gap: "15px", alignItems: "center", backgroundColor: "#242424", padding: "10px", borderRadius: "8px", marginBottom: "20px", border: "1px solid #2a2a2a" },
    shareImage: { width: "60px", height: "60px", objectFit: "cover", borderRadius: "6px", backgroundColor: "#121212" },
    shareInfo: { display: "flex", flexDirection: "column" },
    shareMediaTitle: { margin: "0 0 5px 0", fontSize: "14px", fontWeight: "bold", color: "#ffffff", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis", maxWidth: "200px" },
    shareEventName: { margin: 0, fontSize: "12px", color: "#a0a0a0" },
    shareButtons: { display: "flex", flexDirection: "column", gap: "10px" },
    shareButton: { padding: "12px", borderRadius: "8px", border: "none", color: "white", fontWeight: "bold", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: "10px", fontSize: "14px", transition: "opacity 0.2s" },

    tagPill: { backgroundColor: "rgba(98, 0, 234, 0.15)", border: "1px solid rgba(98, 0, 234, 0.4)", color: "#b388ff", padding: "4px 10px", borderRadius: "16px", fontSize: "12px", fontWeight: "bold", whiteSpace: "nowrap" },
    smartTag: { backgroundColor: "rgba(105, 240, 174, 0.1)", border: "1px solid rgba(105, 240, 174, 0.3)", color: "#69f0ae", padding: "4px 8px", borderRadius: "6px", fontSize: "11px", fontWeight: "bold", textTransform: "lowercase", letterSpacing: "0.5px" },
    smartTagHighlighted: { backgroundColor: "rgba(105, 240, 174, 0.25)", border: "1px solid #69f0ae", color: "#ffffff", padding: "4px 8px", borderRadius: "6px", fontSize: "11px", fontWeight: "bold", textTransform: "lowercase", letterSpacing: "0.5px", boxShadow: "0 0 8px rgba(105, 240, 174, 0.4)" },

    deleteOverlay: { position: "fixed", top: 0, left: 0, width: "100vw", height: "100vh", backgroundColor: "rgba(0, 0, 0, 0.8)", zIndex: 10003, display: "flex", justifyContent: "center", alignItems: "center", backdropFilter: "blur(4px)" },
    deleteModal: { width: "90%", maxWidth: "400px", backgroundColor: "#1e1e1e", borderRadius: "12px", border: "1px solid #ff5252", display: "flex", flexDirection: "column", boxShadow: "0 15px 40px rgba(255,82,82,0.2)", padding: "24px", textAlign: "center" },
    deleteTitle: { margin: "0 0 10px 0", fontSize: "20px", color: "#ff5252", fontWeight: "bold" },
    deleteText: { margin: "0 0 20px 0", fontSize: "15px", color: "#e0e0e0", lineHeight: "1.5" },
    deleteActions: { display: "flex", gap: "15px", justifyContent: "center" },
    deleteBtnCancel: { padding: "10px 20px", backgroundColor: "#2c2c2c", color: "white", border: "none", borderRadius: "8px", cursor: "pointer", fontWeight: "bold", flex: 1 },
    deleteBtnConfirm: { padding: "10px 20px", backgroundColor: "#ff5252", color: "white", border: "none", borderRadius: "8px", cursor: "pointer", fontWeight: "bold", flex: 1, opacity: isDeletingMedia ? 0.7 : 1 },
    trashIconBtn: { position: "absolute", top: "10px", right: "10px", backgroundColor: "rgba(244, 67, 54, 0.85)", color: "white", border: "none", borderRadius: "50%", width: "32px", height: "32px", display: "flex", justifyContent: "center", alignItems: "center", cursor: "pointer", zIndex: 10, transition: "background 0.2s" },

    // SVGs (Synchronized with EventDetails)
    heartFilled: <svg width="18" height="18" viewBox="0 0 24 24" fill="#ff5252" xmlns="http://www.w3.org/2000/svg"><path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"/></svg>,
    heartOutline: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#a0a0a0" strokeWidth="2" xmlns="http://www.w3.org/2000/svg"><path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"/></svg>,
    commentIcon: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#a0a0a0" strokeWidth="2" xmlns="http://www.w3.org/2000/svg"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path></svg>,
    starFilled: <svg width="18" height="18" viewBox="0 0 24 24" fill="#ffd700" xmlns="http://www.w3.org/2000/svg"><path d="M12 17.27L18.18 21l-1.64-7.03L22 9.24l-7.19-.61L12 2 9.19 8.63 2 9.24l5.46 4.73L5.82 21z"/></svg>,
    starOutline: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#a0a0a0" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" xmlns="http://www.w3.org/2000/svg"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"></polygon></svg>,
    shareIcon: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#a0a0a0" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" xmlns="http://www.w3.org/2000/svg"><circle cx="18" cy="5" r="3"></circle><circle cx="6" cy="12" r="3"></circle><circle cx="18" cy="19" r="3"></circle><line x1="8.59" y1="13.51" x2="15.42" y2="17.49"></line><line x1="15.41" y1="6.51" x2="8.59" y2="10.49"></line></svg>,
    tagIcon: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#a0a0a0" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" xmlns="http://www.w3.org/2000/svg"><path d="M20.59 13.41l-7.17 7.17a2 2 0 0 1-2.83 0L2 12V2h10l8.59 8.59a2 2 0 0 1 0 2.82z"></path><line x1="7" y1="7" x2="7.01" y2="7"></line></svg>,
    usersIcon: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#a0a0a0" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" xmlns="http://www.w3.org/2000/svg"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path><circle cx="9" cy="7" r="4"></circle><path d="M23 21v-2a4 4 0 0 0-3-3.87"></path><path d="M16 3.13a4 4 0 0 1 0 7.75"></path></svg>,
    trashIcon: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#ffffff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" xmlns="http://www.w3.org/2000/svg"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path><line x1="10" y1="11" x2="10" y2="17"></line><line x1="14" y1="11" x2="14" y2="17"></line></svg>
  };

  if (loading) return <div style={{...styles.container, textAlign: "center", paddingTop: "100px"}}>Loading favorites...</div>;
  if (error) return <div style={styles.container}><div style={styles.wrapper}><p style={{color: "#ff5252"}}>{error}</p></div></div>;

  return (
    <div style={styles.container}>
      <div style={styles.wrapper}>
        <div style={styles.header}>
          <div style={{ display: "flex", alignItems: "center", gap: "15px" }}>
            <button onClick={() => navigate("/dashboard")} style={{ ...styles.backBtn, marginBottom: "10px" }}>← Dashboard</button>
            <h1 style={styles.title}>My Favorites ⭐</h1>
          </div>
          <p style={{ color: "#a0a0a0", lineHeight: "1.6", margin: 0 }}>Your personal collection of saved photos and videos.</p>
        </div>

        {media.length === 0 ? (
          <div style={styles.emptyState}>
            You haven't saved any media yet. Explore events and click the ⭐ to save!
          </div>
        ) : (
          <div style={styles.grid}>
            {media.map((item, index) => (
              <div
                key={item.id}
                style={styles.mediaCard}
                onMouseEnter={(e) => { e.currentTarget.style.transform = "scale(1.03)"; e.currentTarget.style.boxShadow = "0 8px 20px rgba(0,0,0,0.4)"; }}
                onMouseLeave={(e) => { e.currentTarget.style.transform = "scale(1)"; e.currentTarget.style.boxShadow = "none"; }}
              >
                {/* Delete Media Button logic synchronized */}
                {currentUser && (item.uploadedBy === currentUser.uid || role === "Admin") && (
                  <button onClick={(e) => { e.stopPropagation(); setMediaToDelete(item); }} style={styles.trashIconBtn} onMouseOver={(e) => e.currentTarget.style.backgroundColor = "#ff5252"} onMouseOut={(e) => e.currentTarget.style.backgroundColor = "rgba(244, 67, 54, 0.85)"} title="Delete Media">
                    {styles.trashIcon}
                  </button>
                )}

                {item.mediaType && item.mediaType.startsWith("video") ? (
                  <video controls preload="metadata" onClick={() => openLightbox(index)} style={styles.image}>
                    <source src={item.mediaUrl} type={item.mediaType} />
                  </video>
                ) : (
                  <img src={item.mediaUrl} alt={item.title} style={styles.image} loading="lazy" onClick={() => openLightbox(index)} />
                )}
                
                <div style={styles.mediaInfo}>
                  <p style={{ margin: "0 0 10px 0", fontWeight: "bold", textOverflow: "ellipsis", overflow: "hidden", whiteSpace: "nowrap" }}>{item.title}</p>
                  
                  {/* FULL ACTION BAR SYNCHRONIZED */}
                  <div style={{ display: "flex", gap: "15px", alignItems: "center", flexWrap: "wrap" }}>
                    <button onClick={(e) => handleLikeToggle(e, item)} style={{ background: "none", border: "none", cursor: "pointer", display: "flex", alignItems: "center", gap: "6px", padding: 0 }}>
                      {item.likes && item.likes.includes(currentUser?.uid) ? styles.heartFilled : styles.heartOutline}
                      <span style={{ fontSize: "14px", color: "#a0a0a0", fontWeight: "bold" }}>{item.likesCount || 0}</span>
                    </button>
                    <button onClick={(e) => openCommentPanel(e, item.id)} style={{ background: "none", border: "none", cursor: "pointer", display: "flex", alignItems: "center", gap: "6px", padding: 0 }}>
                      {styles.commentIcon}
                      <span style={{ fontSize: "14px", color: "#a0a0a0", fontWeight: "bold" }}>{item.commentsCount || 0}</span>
                    </button>
                    <button onClick={(e) => handleFavoriteToggle(e, item)} style={{ background: "none", border: "none", cursor: "pointer", display: "flex", alignItems: "center", gap: "6px", padding: 0 }}>
                      {item.favorites && item.favorites.includes(currentUser?.uid) ? styles.starFilled : styles.starOutline}
                      <span style={{ fontSize: "14px", color: "#a0a0a0", fontWeight: "bold" }}>Save</span>
                    </button>
                    <button onClick={(e) => openShareModal(e, item)} style={{ background: "none", border: "none", cursor: "pointer", display: "flex", alignItems: "center", gap: "6px", padding: 0 }}>
                      {styles.shareIcon}
                      <span style={{ fontSize: "14px", color: "#a0a0a0", fontWeight: "bold" }}>Share</span>
                    </button>
                    {item.tags && item.tags.length > 0 && (
                      <button onClick={(e) => openViewTagsModal(e, item)} style={{ background: "none", border: "none", cursor: "pointer", display: "flex", alignItems: "center", gap: "6px", padding: 0 }}>
                        {styles.tagIcon}
                        <span style={{ fontSize: "14px", color: "#a0a0a0", fontWeight: "bold" }}>Tags</span>
                      </button>
                    )}
                    {item.taggedUsers && item.taggedUsers.length > 0 && (
                      <button onClick={(e) => openViewTaggedUsersModal(e, item)} style={{ background: "none", border: "none", cursor: "pointer", display: "flex", alignItems: "center", gap: "6px", padding: 0 }}>
                        {styles.usersIcon}
                        <span style={{ fontSize: "14px", color: "#a0a0a0", fontWeight: "bold" }}>Users</span>
                      </button>
                    )}
                    {currentUser && (item.uploadedBy === currentUser.uid || role === "Admin") && (
                      <button onClick={(e) => openTagModal(e, item)} style={{ background: "none", border: "none", cursor: "pointer", display: "flex", alignItems: "center", gap: "6px", padding: 0 }}>
                        {styles.tagIcon}
                        <span style={{ fontSize: "14px", color: "#a0a0a0", fontWeight: "bold" }}>Add Tag</span>
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* FULLSCREEN LIGHTBOX MODAL */}
      {lightboxOpen && currentLightboxMedia && (
        <div style={styles.lightboxOverlay} onClick={closeLightbox}>
          <button style={styles.lightboxCloseBtn} onClick={closeLightbox}>&times;</button>
          
          {media.length > 1 && (
            <>
              <button style={styles.lightboxNavLeft} onClick={goPrev} onMouseOver={(e) => e.target.style.background = "rgba(255, 255, 255, 0.3)"} onMouseOut={(e) => e.target.style.background = "rgba(255, 255, 255, 0.1)"}>&#10094;</button>
              <button style={styles.lightboxNavRight} onClick={goNext} onMouseOver={(e) => e.target.style.background = "rgba(255, 255, 255, 0.3)"} onMouseOut={(e) => e.target.style.background = "rgba(255, 255, 255, 0.1)"}>&#10095;</button>
            </>
          )}

          <div style={styles.lightboxContentWrapper} onClick={(e) => e.stopPropagation()}>
            {currentLightboxMedia.mediaType && currentLightboxMedia.mediaType.startsWith("video") ? (
              <video controls autoPlay style={styles.lightboxVideo} key={currentLightboxMedia.mediaUrl}>
                <source src={currentLightboxMedia.mediaUrl} type={currentLightboxMedia.mediaType} />
              </video>
            ) : (
              <img src={currentLightboxMedia.mediaUrl} alt={currentLightboxMedia.title} style={styles.lightboxImage} />
            )}
            
            <div style={styles.lightboxCaption}>
              {currentLightboxMedia.title}
              {media.length > 1 && (
                <span style={{ color: "#a0a0a0", marginLeft: "10px", fontSize: "14px", fontWeight: "normal" }}>
                  ({lightboxData.index + 1} / {media.length})
                </span>
              )}
            </div>

            {/* LIGHTBOX ACTIONS SYNCHRONIZED */}
            <div style={{ display: "flex", gap: "10px", marginTop: "15px", flexWrap: "wrap", justifyContent: "center" }}>
              <button style={styles.lightboxBtn} onClick={(e) => handleLikeToggle(e, currentLightboxMedia)} onMouseOver={(e) => e.currentTarget.style.backgroundColor = "#444"} onMouseOut={(e) => e.currentTarget.style.backgroundColor = "#2c2c2c"}>
                {currentLightboxMedia.likes && currentLightboxMedia.likes.includes(currentUser?.uid) ? styles.heartFilled : styles.heartOutline}
                <span style={{ marginLeft: "5px" }}>{currentLightboxMedia.likesCount || 0}</span>
              </button>
              {currentLightboxMedia.tags && currentLightboxMedia.tags.length > 0 && (
                <button style={styles.lightboxBtn} onClick={(e) => openViewTagsModal(e, currentLightboxMedia)} onMouseOver={(e) => e.currentTarget.style.backgroundColor = "#444"} onMouseOut={(e) => e.currentTarget.style.backgroundColor = "#2c2c2c"}>
                  {styles.tagIcon}
                  <span style={{ marginLeft: "5px" }}>Tags</span>
                </button>
              )}
              {currentLightboxMedia.taggedUsers && currentLightboxMedia.taggedUsers.length > 0 && (
                <button style={styles.lightboxBtn} onClick={(e) => openViewTaggedUsersModal(e, currentLightboxMedia)} onMouseOver={(e) => e.currentTarget.style.backgroundColor = "#444"} onMouseOut={(e) => e.currentTarget.style.backgroundColor = "#2c2c2c"}>
                  {styles.usersIcon}
                  <span style={{ marginLeft: "5px" }}>Tagged Users</span>
                </button>
              )}
              <button style={styles.lightboxBtn} onClick={(e) => openCommentPanel(e, currentLightboxMedia.id)} onMouseOver={(e) => e.currentTarget.style.backgroundColor = "#444"} onMouseOut={(e) => e.currentTarget.style.backgroundColor = "#2c2c2c"}>
                {styles.commentIcon}
                <span style={{ marginLeft: "5px" }}>{currentLightboxMedia.commentsCount || 0} Comments</span>
              </button>
              <button style={styles.lightboxBtn} onClick={(e) => handleFavoriteToggle(e, currentLightboxMedia)} onMouseOver={(e) => e.currentTarget.style.backgroundColor = "#444"} onMouseOut={(e) => e.currentTarget.style.backgroundColor = "#2c2c2c"}>
                {currentLightboxMedia.favorites && currentLightboxMedia.favorites.includes(currentUser?.uid) ? styles.starFilled : styles.starOutline}
                <span style={{ marginLeft: "5px" }}>{currentLightboxMedia.favorites && currentLightboxMedia.favorites.includes(currentUser?.uid) ? "Saved" : "Save"}</span>
              </button>
              <button style={styles.lightboxBtn} onClick={(e) => openShareModal(e, currentLightboxMedia)} onMouseOver={(e) => e.currentTarget.style.backgroundColor = "#444"} onMouseOut={(e) => e.currentTarget.style.backgroundColor = "#2c2c2c"}>
                {styles.shareIcon}
                <span style={{ marginLeft: "5px" }}>Share</span>
              </button>
              {currentUser && (currentLightboxMedia.uploadedBy === currentUser.uid || role === "Admin") && (
                <button style={styles.lightboxBtn} onClick={(e) => openTagModal(e, currentLightboxMedia)} onMouseOver={(e) => e.currentTarget.style.backgroundColor = "#444"} onMouseOut={(e) => e.currentTarget.style.backgroundColor = "#2c2c2c"}>
                  {styles.tagIcon}
                  <span style={{ marginLeft: "5px" }}>Tag</span>
                </button>
              )}
              {currentUser && (currentLightboxMedia.uploadedBy === currentUser.uid || role === "Admin") && (
                <button 
                  style={{...styles.lightboxBtn, color: "#ff5252", borderColor: "#ff5252"}} 
                  onClick={(e) => { e.stopPropagation(); setMediaToDelete(currentLightboxMedia); }}
                  onMouseOver={(e) => e.currentTarget.style.backgroundColor = "rgba(244, 67, 54, 0.1)"}
                  onMouseOut={(e) => e.currentTarget.style.backgroundColor = "#2c2c2c"}
                >
                  {styles.trashIcon}
                  <span style={{ marginLeft: "5px" }}>Delete</span>
                </button>
              )}
              <button style={styles.lightboxBtn} onClick={handleDownload} disabled={isDownloading} onMouseOver={(e) => !isDownloading && (e.currentTarget.style.backgroundColor = "#444")} onMouseOut={(e) => !isDownloading && (e.currentTarget.style.backgroundColor = "#2c2c2c")}>
                {isDownloading ? (currentLightboxMedia.mediaType && currentLightboxMedia.mediaType.startsWith("video") ? "⏳ Downloading..." : "⏳ Generating Watermark...") : "⬇ Download"}
              </button>
            </div>
            
          </div>
        </div>
      )}

      {/* DEDICATED COMMENT PANEL MODAL */}
      {commentPanelId && activeCommentMedia && (
        <div style={styles.commentOverlay} onClick={closeCommentPanel}>
          <div style={styles.commentModal} onClick={(e) => e.stopPropagation()}>
            <div style={styles.commentHeader}>
              <h3 style={styles.commentTitle}>Comments ({activeCommentMedia.commentsCount || 0})</h3>
              <button style={styles.commentCloseIcon} onClick={closeCommentPanel}>&times;</button>
            </div>
            <div style={styles.commentList}>
              {(!activeCommentMedia.comments || activeCommentMedia.comments.length === 0) ? (
                <div style={{ textAlign: "center", color: "#777", marginTop: "20px" }}>No comments yet. Be the first!</div>
              ) : (
                activeCommentMedia.comments.map((c) => (
                  <div key={c.id} style={styles.commentCard}>
                    <div style={styles.commentHeaderRow}>
                      <span style={styles.commentName}>{c.userName}</span>
                      <span style={styles.commentDate}>{formatTime(c.createdAt)}</span>
                    </div>
                    <p style={styles.commentText}>{c.text}</p>
                  </div>
                ))
              )}
            </div>
            <form onSubmit={handleAddComment} style={styles.commentInputArea}>
              <input type="text" placeholder="Write a comment..." value={commentText} onChange={(e) => setCommentText(e.target.value)} style={styles.commentInput} autoFocus />
              <button type="submit" disabled={!commentText.trim()} style={{ ...styles.commentSubmitBtn, opacity: !commentText.trim() ? 0.5 : 1 }}>Post</button>
            </form>
          </div>
        </div>
      )}

      {/* DEDICATED SHARE MODAL */}
      {shareModalOpen && shareMediaItem && (
        <div style={styles.shareOverlay} onClick={closeShareModal}>
          <div style={styles.shareModal} onClick={(e) => e.stopPropagation()}>
            <div style={styles.shareHeader}>
              <h3 style={styles.shareTitle}>Share Media</h3>
              <button style={styles.shareCloseIcon} onClick={closeShareModal}>&times;</button>
            </div>
            <div style={styles.sharePreview}>
              {shareMediaItem.mediaType && shareMediaItem.mediaType.startsWith("video") ? (
                <video src={shareMediaItem.mediaUrl} style={styles.shareImage} />
              ) : (
                <img src={shareMediaItem.mediaUrl} alt={shareMediaItem.title} style={styles.shareImage} />
              )}
              <div style={styles.shareInfo}>
                <p style={styles.shareMediaTitle}>{shareMediaItem.title}</p>
                <p style={styles.shareEventName}>{shareMediaItem?.eventName || "Event Media"}</p>
              </div>
            </div>
            <div style={styles.shareButtons}>
              <button onClick={handleCopyLink} style={{ ...styles.shareButton, backgroundColor: "#2c2c2c", border: "1px solid #444" }}>🔗 Copy Link</button>
              <button onClick={() => window.open(`https://wa.me/?text=${encodeURIComponent(`Check out ${shareMediaItem.title} from ${shareMediaItem?.eventName || 'SnapShare'}: http://localhost:5173/events/${shareMediaItem?.eventId}`)}`, "_blank")} style={{ ...styles.shareButton, backgroundColor: "#25D366", color: "#fff" }}>WhatsApp</button>
              <button onClick={() => window.open(`https://t.me/share/url?url=${encodeURIComponent(`http://localhost:5173/events/${shareMediaItem?.eventId}`)}&text=${encodeURIComponent(`Check out ${shareMediaItem.title} from ${shareMediaItem?.eventName || 'SnapShare'}`)}`, "_blank")} style={{ ...styles.shareButton, backgroundColor: "#0088cc", color: "#fff" }}>Telegram</button>
              <button onClick={() => window.open(`https://twitter.com/intent/tweet?url=${encodeURIComponent(`http://localhost:5173/events/${shareMediaItem?.eventId}`)}&text=${encodeURIComponent(`Check out ${shareMediaItem.title} from ${shareMediaItem?.eventName || 'SnapShare'}`)}`, "_blank")} style={{ ...styles.shareButton, backgroundColor: "#1DA1F2", color: "#fff" }}>Twitter / X</button>
            </div>
          </div>
        </div>
      )}

      {/* DEDICATED DELETE CONFIRMATION MODAL */}
      {mediaToDelete && (
        <div style={styles.deleteOverlay} onClick={() => !isDeletingMedia && setMediaToDelete(null)}>
          <div style={styles.deleteModal} onClick={(e) => e.stopPropagation()}>
            <h3 style={styles.deleteTitle}>Delete Media</h3>
            <p style={styles.deleteText}>
              Are you sure you want to permanently delete this media? <br/><br/>
              <strong>This action cannot be undone.</strong>
            </p>
            <div style={styles.deleteActions}>
              <button 
                onClick={() => setMediaToDelete(null)} 
                disabled={isDeletingMedia}
                style={styles.deleteBtnCancel}
              >
                Cancel
              </button>
              <button 
                onClick={confirmDeleteMedia} 
                disabled={isDeletingMedia}
                style={styles.deleteBtnConfirm}
              >
                {isDeletingMedia ? "Deleting..." : "Delete"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* VIEW TAGS MODAL */}
      {viewTagsModalOpen && viewTagsMediaItem && (
        <div style={styles.shareOverlay} onClick={closeViewTagsModal}>
          <div style={styles.shareModal} onClick={(e) => e.stopPropagation()}>
            <div style={styles.shareHeader}>
              <h3 style={styles.shareTitle}>🏷 Tags</h3>
              <button style={styles.shareCloseIcon} onClick={closeViewTagsModal}>&times;</button>
            </div>
            <div style={{ display: "flex", flexWrap: "wrap", gap: "10px", padding: "10px 0" }}>
              {viewTagsMediaItem.tags.map((tag, i) => (
                <span key={i} style={{ ...styles.smartTag, fontSize: "14px", padding: "8px 12px" }}>#{tag}</span>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* VIEW TAGGED USERS MODAL */}
      {viewTaggedUsersModalOpen && viewTaggedUsersMediaItem && (
        <div style={styles.shareOverlay} onClick={closeViewTaggedUsersModal}>
          <div style={styles.shareModal} onClick={(e) => e.stopPropagation()}>
            <div style={styles.shareHeader}>
              <h3 style={styles.shareTitle}>👥 Tagged Users</h3>
              <button style={styles.shareCloseIcon} onClick={closeViewTaggedUsersModal}>&times;</button>
            </div>
            <div style={{ display: "flex", flexWrap: "wrap", gap: "10px", padding: "10px 0" }}>
              {viewTaggedUsersMediaItem.taggedUsers.map(u => (
                <span key={u.uid} style={{ ...styles.tagPill, fontSize: "14px", padding: "8px 12px" }}>{u.displayName}</span>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* TAG USERS MODAL */}
      <TagUsersModal isOpen={tagModalOpen} onClose={closeTagModal} mediaItem={tagMediaItem} onSaveTags={handleSaveTags} />
    </div>
  );
}