// src/pages/LandingPage.jsx

import React from "react";
import { useNavigate } from "react-router-dom";

export default function LandingPage() {
  const navigate = useNavigate();

  const styles = {
    container: { minHeight: "100vh", backgroundColor: "#121212", color: "#ffffff", fontFamily: "sans-serif", overflowX: "hidden" },
    navbar: { display: "flex", justifyContent: "space-between", alignItems: "center", padding: "20px 5%", minHeight: "80px", backgroundColor: "rgba(18, 18, 18, 0.9)", backdropFilter: "blur(10px)", position: "fixed", top: 0, width: "100%", boxSizing: "border-box", zIndex: 1000, borderBottom: "1px solid #2a2a2a" },
    logo: { fontSize: "28px", fontWeight: "bold", color: "#ffffff", margin: 0, display: "flex", alignItems: "center", gap: "10px", lineHeight: "1" },
    logoAccent: { color: "#69f0ae" },
    navButtons: { display: "flex", gap: "15px" },
    loginBtn: { padding: "10px 20px", backgroundColor: "transparent", color: "#ffffff", border: "1px solid #444", borderRadius: "8px", fontWeight: "bold", cursor: "pointer", transition: "0.2s" },
    signupBtn: { padding: "10px 20px", backgroundColor: "#6200ea", color: "#ffffff", border: "none", borderRadius: "8px", fontWeight: "bold", cursor: "pointer", transition: "0.2s", boxShadow: "0 4px 15px rgba(98, 0, 234, 0.4)" },
    
    hero: { padding: "160px 20px 40px", textAlign: "center", background: "radial-gradient(circle at 50% 0%, rgba(98, 0, 234, 0.15) 0%, #121212 70%)" },
    heroTitle: { 
      fontSize: "clamp(40px, 8vw, 64px)", 
      fontWeight: "900", 
      margin: "0 0 20px 0", 
      background: "linear-gradient(135deg, #ffffff 0%, #a0a0a0 100%)", 
      WebkitBackgroundClip: "text", 
      WebkitTextFillColor: "transparent",
      lineHeight: "1.2", 
      paddingTop: "10px",
      paddingBottom: "10px"
    },
    heroSubtitle: { fontSize: "clamp(18px, 4vw, 24px)", color: "#69f0ae", margin: "0 0 30px 0", fontWeight: "bold" },
    heroDesc: { fontSize: "18px", color: "#a0a0a0", maxWidth: "700px", margin: "0 auto 40px auto", lineHeight: "1.6" },
    heroActions: { display: "flex", justifyContent: "center", gap: "16px", flexWrap: "wrap" },
    primaryBtn: { width: "250px", padding: "16px 0", fontSize: "18px", backgroundColor: "#6200ea", color: "#ffffff", border: "none", borderRadius: "8px", fontWeight: "bold", cursor: "pointer", transition: "0.2s", boxShadow: "0 4px 20px rgba(98, 0, 234, 0.5)", textAlign: "center" },

    section: { padding: "40px 5% 80px", maxWidth: "1200px", margin: "0 auto" },
    sectionTitle: { textAlign: "center", fontSize: "36px", marginBottom: "50px", color: "#ffffff" },
    
    grid: { display: "flex", flexWrap: "wrap", gap: "30px", justifyContent: "center" },
    card: { flex: "1 1 300px", maxWidth: "350px", backgroundColor: "#1e1e1e", padding: "30px", borderRadius: "16px", border: "1px solid #2a2a2a", transition: "transform 0.3s ease, box-shadow 0.3s ease", cursor: "default" },
    iconBox: { width: "60px", height: "60px", backgroundColor: "rgba(98, 0, 234, 0.1)", borderRadius: "12px", display: "flex", justifyContent: "center", alignItems: "center", fontSize: "28px", marginBottom: "20px", border: "1px solid rgba(98, 0, 234, 0.3)" },
    cardTitle: { fontSize: "20px", margin: "0 0 15px 0", color: "#ffffff" },
    cardDesc: { fontSize: "15px", color: "#a0a0a0", lineHeight: "1.6", margin: 0 },

    stepsWrapper: { display: "flex", flexWrap: "wrap", gap: "20px", justifyContent: "space-between", marginTop: "40px" },
    stepCard: { flex: "1 1 250px", textAlign: "center", padding: "20px" },
    stepNumber: { width: "50px", height: "50px", backgroundColor: "#69f0ae", color: "#121212", borderRadius: "50%", display: "flex", justifyContent: "center", alignItems: "center", fontSize: "24px", fontWeight: "bold", margin: "0 auto 20px auto" },
    
    footer: { textAlign: "center", padding: "30px", borderTop: "1px solid #2a2a2a", color: "#777", fontSize: "14px", marginTop: "60px" }
  };

  const features = [
    { icon: "🤖", title: "AI Face Recognition", desc: "Upload a selfie and our AWS-powered AI will automatically find and collect every photo you appear in." },
    { icon: "🔍", title: "Smart Search", desc: "Instantly find media by searching for AI-generated tags, event names, categories, or the uploader's name." },
    { icon: "☁️", title: "AWS Cloud Storage", desc: "Secure, highly scalable, and optimized cloud storage for high-quality photos and videos." },
    { icon: "🔔", title: "Real-time Notifications", desc: "Get instant alerts when someone likes, comments, or tags you in an event photo." },
    { icon: "⭐", title: "Favorites & Galleries", desc: "Create your own curated collections and save your favorite memories with a single click." },
    { icon: "🛡️", title: "Secure & Private", desc: "Role-based access control ensures private club media remains strictly visible only to approved members." }
  ];

  return (
    <div style={styles.container}>
      
      {/* NAVBAR */}
      <nav style={styles.navbar}>
        <h1 style={styles.logo}>
          <span style={styles.logoAccent}>⬡</span> SnapShare
        </h1>
      </nav>

      {/* HERO SECTION */}
      <header style={styles.hero}>
        <h1 style={styles.heroTitle}>SnapShare</h1>
        <h2 style={styles.heroSubtitle}>Smart Event Photo Management Platform</h2>
        <p style={styles.heroDesc}>
          The ultimate ecosystem for college clubs and event organizers. Upload bulk media, tag users automatically with AI Facial Recognition, and search through thousands of memories instantly using Smart Tags.
        </p>
        <div style={styles.heroActions}>
          <button 
            style={styles.primaryBtn} 
            onClick={() => navigate("/signup")}
            onMouseOver={(e) => e.target.style.transform = "translateY(-2px)"}
            onMouseOut={(e) => e.target.style.transform = "translateY(0)"}
          >
            Create Free Account
          </button>
          <button 
            style={styles.primaryBtn} 
            onClick={() => navigate("/login")}
            onMouseOver={(e) => e.target.style.transform = "translateY(-2px)"}
            onMouseOut={(e) => e.target.style.transform = "translateY(0)"}
          >
            Login
          </button>
        </div>
      </header>

      {/* FEATURES SECTION */}
      <section style={styles.section}>
        <h2 style={styles.sectionTitle}>Powerful Features</h2>
        <div style={styles.grid}>
          {features.map((feat, index) => (
            <div 
              key={index} 
              style={styles.card}
              onMouseEnter={(e) => { e.currentTarget.style.transform = "translateY(-10px)"; e.currentTarget.style.boxShadow = "0 15px 30px rgba(98, 0, 234, 0.2)"; }}
              onMouseLeave={(e) => { e.currentTarget.style.transform = "translateY(0)"; e.currentTarget.style.boxShadow = "none"; }}
            >
              <div style={styles.iconBox}>{feat.icon}</div>
              <h3 style={styles.cardTitle}>{feat.title}</h3>
              <p style={styles.cardDesc}>{feat.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* HOW IT WORKS SECTION */}
      <section style={{...styles.section, backgroundColor: "#1e1e1e", maxWidth: "100%", padding: "80px 5%" }}>
        <div style={{ maxWidth: "1200px", margin: "0 auto" }}>
          <h2 style={styles.sectionTitle}>How It Works</h2>
          <div style={styles.stepsWrapper}>
            
            <div style={styles.stepCard}>
              <div style={styles.stepNumber}>1</div>
              <h3 style={styles.cardTitle}>Create Account</h3>
              <p style={styles.cardDesc}>Sign up and upload a clear reference selfie to your profile.</p>
            </div>

            <div style={styles.stepCard}>
              <div style={styles.stepNumber}>2</div>
              <h3 style={styles.cardTitle}>Photos Uploaded</h3>
              <p style={styles.cardDesc}>Event photographers upload thousands of high-quality images to the AWS Cloud.</p>
            </div>

            <div style={styles.stepCard}>
              <div style={styles.stepNumber}>3</div>
              <h3 style={styles.cardTitle}>AI Magic</h3>
              <p style={styles.cardDesc}>Our backend AWS Rekognition engine instantly scans, tags, and organizes everything.</p>
            </div>

            <div style={styles.stepCard}>
              <div style={{...styles.stepNumber, backgroundColor: "#6200ea", color: "#fff"}}>4</div>
              <h3 style={styles.cardTitle}>Find Memories</h3>
              <p style={styles.cardDesc}>Open "My Photos" to instantly see every single picture you appear in!</p>
            </div>

          </div>
        </div>
      </section>

      {/* FOOTER */}
      <footer style={styles.footer}>
        <p>&copy; {new Date().getFullYear()} SnapShare. All rights reserved.</p>
        <p style={{ marginTop: "10px", fontSize: "12px", color: "#444" }}>Built for seamless event media management.</p>
      </footer>

    </div>
  );
}