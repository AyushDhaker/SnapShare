// src/pages/AdminPanel.jsx

import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { collection, getDocs, doc, updateDoc } from "firebase/firestore";
import { db } from "../firebase";
import { useAuth } from "../context/AuthContext";

export default function AdminPanel() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  
  const { currentUser } = useAuth();
  const navigate = useNavigate();

  // Fetch all users on component mount
  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      setError("");
      const usersCollection = collection(db, "users");
      const userSnapshot = await getDocs(usersCollection);
      const userList = userSnapshot.docs.map(docItem => ({
        id: docItem.id,
        ...docItem.data()
        }));

        // Sort newest users first
        userList.sort((a, b) => {
        const aTime = a.createdAt?.seconds || 0;
        const bTime = b.createdAt?.seconds || 0;
        return bTime - aTime;
        });

        setUsers(userList);
    } catch (err) {
      console.error("Error fetching users:", err);
      setError("Failed to load users. Please check your database connection.");
    } finally {
      setLoading(false);
    }
  };

  // Generic function to display temporary success messages
  const showSuccess = (message) => {
    setSuccess(message);
    setTimeout(() => setSuccess(""), 3000);
  };

  // Toggle user approval status
  const handleApprovalToggle = async (userId, currentStatus) => {
    try {
      setError("");
      const userRef = doc(db, "users", userId);
      await updateDoc(userRef, {
        isApproved: !currentStatus
      });
      
      // Update local state to reflect change immediately
      setUsers(users.map(user => 
        user.id === userId ? { ...user, isApproved: !currentStatus } : user
      ));
      
      showSuccess(`User has been ${!currentStatus ? 'approved' : 'rejected'}.`);
    } catch (err) {
      console.error("Error updating approval status:", err);
      setError("Failed to update user status.");
    }
  };

  // Handle role change from dropdown
  const handleRoleChange = async (userId, newRole) => {
    try {
        setError("");

        if (
        newRole === "Admin" &&
        !window.confirm(
            "Are you sure you want to grant Admin access?"
        )
        ) {
        return;
        }

        const userRef = doc(db, "users", userId);

        await updateDoc(userRef, {
        role: newRole
        });

        setUsers(
        users.map(user =>
            user.id === userId
            ? { ...user, role: newRole }
            : user
        )
        );

        showSuccess(`Role updated to ${newRole}`);
    } catch (err) {
        console.error(err);
        setError("Failed to update role.");
    }
    };

  // Dark UI Inline Styles
  const styles = {
    container: {
      minHeight: "100vh",
      backgroundColor: "#121212",
      color: "#ffffff",
      padding: "40px 20px",
      fontFamily: "'Inter', 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif",
    },
    wrapper: {
      maxWidth: "1200px",
      margin: "0 auto",
    },
    header: {
      display: "flex",
      justifyContent: "space-between",
      alignItems: "center",
      marginBottom: "30px",
    },
    title: {
      margin: 0,
      fontSize: "28px",
      color: "#ff5252",
    },
    backBtn: {
      padding: "10px 16px",
      backgroundColor: "#2c2c2c",
      color: "#ffffff",
      border: "1px solid #444",
      borderRadius: "6px",
      cursor: "pointer",
      fontWeight: "600",
    },
    alertError: {
      backgroundColor: "rgba(244, 67, 54, 0.1)",
      color: "#ff5252",
      padding: "12px",
      borderRadius: "8px",
      marginBottom: "20px",
      border: "1px solid rgba(244, 67, 54, 0.3)",
    },
    alertSuccess: {
      backgroundColor: "rgba(76, 175, 80, 0.1)",
      color: "#69f0ae",
      padding: "12px",
      borderRadius: "8px",
      marginBottom: "20px",
      border: "1px solid rgba(76, 175, 80, 0.3)",
    },
    card: {
      backgroundColor: "#1e1e1e",
      borderRadius: "12px",
      border: "1px solid #2a2a2a",
      overflowX: "auto",
      boxShadow: "0 4px 20px rgba(0,0,0,0.5)",
    },
    table: {
      width: "100%",
      borderCollapse: "collapse",
    },
    th: {
      textAlign: "left",
      padding: "16px",
      borderBottom: "1px solid #333",
      color: "#a0a0a0",
      fontWeight: "600",
      backgroundColor: "#242424",
    },
    td: {
      padding: "16px",
      borderBottom: "1px solid #333",
      verticalAlign: "middle",
    },
    select: {
      backgroundColor: "#2c2c2c",
      color: "#ffffff",
      border: "1px solid #444",
      padding: "8px",
      borderRadius: "4px",
      cursor: "pointer",
      outline: "none",
    },
    selectDisabled: {
      backgroundColor: "#1a1a1a",
      color: "#666",
      border: "1px solid #333",
      padding: "8px",
      borderRadius: "4px",
      cursor: "not-allowed",
    },
    approveBtn: {
      padding: "8px 12px",
      backgroundColor: "rgba(76, 175, 80, 0.15)",
      color: "#69f0ae",
      border: "1px solid rgba(76, 175, 80, 0.3)",
      borderRadius: "4px",
      cursor: "pointer",
      fontWeight: "bold",
    },
    rejectBtn: {
      padding: "8px 12px",
      backgroundColor: "rgba(244, 67, 54, 0.15)",
      color: "#ff5252",
      border: "1px solid rgba(244, 67, 54, 0.3)",
      borderRadius: "4px",
      cursor: "pointer",
      fontWeight: "bold",
    },
    statusBadge: (isApproved) => ({
      padding: "6px 12px",
      borderRadius: "12px",
      fontSize: "12px",
      fontWeight: "bold",
      backgroundColor: isApproved ? "rgba(76, 175, 80, 0.2)" : "rgba(244, 67, 54, 0.2)",
      color: isApproved ? "#69f0ae" : "#ff5252",
      display: "inline-block"
    }),
    loadingContainer: {
      display: "flex",
      justifyContent: "center",
      alignItems: "center",
      minHeight: "50vh",
      fontSize: "20px",
      color: "#a0a0a0"
    }
  };

  if (loading) {
    return (
      <div style={styles.container}>
        <div style={styles.header}>
          <h2 style={styles.title}>Admin Command Center</h2>
          <button onClick={() => navigate("/dashboard")} style={styles.backBtn}>← Back to Dashboard</button>
        </div>
        <div style={styles.loadingContainer}>Loading users data...</div>
      </div>
    );
  }

  return (
    <div style={styles.container}>
      <div style={styles.wrapper}>
        
        <div style={styles.header}>
          <div>
            <h2 style={styles.title}>Admin Command Center</h2>
            <p style={{ color: "#a0a0a0", marginTop: "5px" }}>Manage platform users, roles, and access approvals.</p>
          </div>
          <button onClick={() => navigate("/dashboard")} style={styles.backBtn}>← Back to Dashboard</button>
        </div>

        {error && <div style={styles.alertError}>{error}</div>}
        {success && <div style={styles.alertSuccess}>{success}</div>}

        <div
        style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit,minmax(220px,1fr))",
            gap: "20px",
            marginBottom: "25px"
        }}
        >
        <div style={styles.card}>
            <h3>Total Users</h3>
            <h2>{users.length}</h2>
        </div>

        <div style={styles.card}>
            <h3>Approved Users</h3>
            <h2>{users.filter(u => u.isApproved).length}</h2>
        </div>

        <div style={styles.card}>
            <h3>Pending Users</h3>
            <h2>{users.filter(u => !u.isApproved).length}</h2>
        </div>

        <div style={styles.card}>
            <h3>Photographers</h3>
            <h2>{users.filter(u => u.role === "Photographer").length}</h2>
        </div>
        </div>

        <div style={styles.card}>
          <table style={styles.table}>
            <thead>
              <tr>
                <th style={styles.th}>Name</th>
                <th style={styles.th}>Email</th>
                <th style={styles.th}>Role</th>
                <th style={styles.th}>Status</th>
                <th style={styles.th}>Joined</th>
                <th style={styles.th}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {users.map((user) => {
                const isSelf = currentUser && user.uid === currentUser.uid;

                return (
                  <tr key={user.id}>
                    <td style={styles.td}>
                      <strong style={{ display: "block" }}>{user.name}</strong>
                      {isSelf && <span style={{ fontSize: "12px", color: "#69f0ae" }}>(You)</span>}
                    </td>
                    <td style={styles.td}>{user.email}</td>
                    
                    {/* Role Selection */}
                    <td style={styles.td}>
                      <select 
                        value={user.role || "Viewer"} 
                        onChange={(e) => handleRoleChange(user.id, e.target.value)}
                        style={isSelf ? styles.selectDisabled : styles.select}
                        disabled={isSelf} // Prevent admin from changing their own role
                      >
                        <option value="Viewer">Viewer</option>
                        <option value="ClubMember">ClubMember</option>
                        <option value="Photographer">Photographer</option>
                        <option value="Admin">Admin</option>
                      </select>
                    </td>

                    {/* Approval Status Badge */}
                    <td style={styles.td}>
                      <span style={styles.statusBadge(user.isApproved)}>
                        {user.isApproved ? "Approved" : "Not Approved"}
                      </span>
                    </td>
                    <td style={styles.td}>
                    {user.createdAt?.seconds
                        ? new Date(
                            user.createdAt.seconds * 1000
                        ).toLocaleDateString()
                        : "N/A"}
                    </td>

                    {/* Actions */}
                    <td style={styles.td}>
                      {!isSelf ? (
                        <button 
                          onClick={() => handleApprovalToggle(user.id, user.isApproved)}
                          style={user.isApproved ? styles.rejectBtn : styles.approveBtn}
                        >
                          {user.isApproved ? "Suspend User" : "Approve User"}
                        </button>
                      ) : (
                        <span style={{ color: "#666", fontSize: "14px", fontStyle: "italic" }}>
                          Cannot edit self
                        </span>
                      )}
                    </td>
                  </tr>
                );
              })}
              {users.length === 0 && (
                <tr>
                  <td colSpan="6" style={{ ...styles.td, textAlign: "center", color: "#a0a0a0" }}>
                    No users found in the database.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

      </div>
    </div>
  );
}