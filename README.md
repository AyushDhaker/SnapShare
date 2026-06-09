# 📸 SnapShare
> **Smart Event Photo Management Platform**

SnapShare is an intelligent, scalable platform designed for colleges, clubs, event organizers, and photographers. It revolutionizes event media management by leveraging AWS-powered facial recognition to automatically find, tag, and organize photos for attendees, paired with a modern, highly interactive gallery experience.

---

## 📖 Project Overview

Sorting through hundreds of event photos to find pictures of yourself is tedious. SnapShare solves this by allowing users to upload a single reference selfie. When event photographers upload bulk media, our AI pipeline instantly scans, indexes, and matches faces, delivering a curated **"My Photos"** feed for every user. 

Coupled with a polished Dark Mode/Glassmorphism UI, real-time notifications, and Role-Based Access Control (RBAC), SnapShare acts as a complete social-gallery ecosystem for modern events.

---

## ✨ Features

* **🤖 AI Smart Photo Discovery:** Automatically curates a personalized gallery for users using AWS Rekognition facial matching.
* **🔒 Role-Based Access Control (RBAC):** Restrict "Private Club Media" to approved `ClubMembers`, while managing `Viewers`, `Photographers`, and `Admins`.
* **🔍 Smart Search & Filtering:** Filter event media in real-time by AI-generated tags, uploaders, categories, or media types (image/video).
* **💬 Rich Social Interactions:** Like, comment, and save media to personalized "Favorites" collections.
* **🏷️ Manual Tagging & Notifications:** Event organizers can manually tag users, triggering real-time bell notifications.
* **🛡️ Secure Watermarked Downloads:** Front-end HTML5 Canvas integration dynamically overlays event metadata and watermarks onto images before downloading.
* **🔗 Direct Media Sharing:** Deep-linking and quick-share integrations for WhatsApp, Telegram, and Twitter/X.
* **📱 Modern UI/UX:** A fully responsive, dark-themed interface with glassmorphism elements, custom modals, and interactive lightboxes.

---

## 🛠 Tech Stack

**Frontend:**
* [React.js](https://reactjs.org/) (Vite) - UI Framework
* React Router - SPA Navigation
* HTML5 Canvas - Dynamic image watermarking

**Backend:**
* [Node.js](https://nodejs.org/) & [Express.js](https://expressjs.com/) - Secure API routing and deletion logic

**Database & Authentication:**
* [Firebase Firestore](https://firebase.google.com/docs/firestore) - NoSQL real-time database
* [Firebase Authentication](https://firebase.google.com/docs/auth) - User session and identity management

**Cloud & AI:**
* [AWS S3](https://aws.amazon.com/s3/) - Highly scalable cloud blob storage
* [AWS Rekognition](https://aws.amazon.com/rekognition/) - Facial indexing and analysis

---

## 📁 Project Structure

```text
SnapShare-AI/
├── backend/                 # Node.js / Express API Server
│   ├── .env                 # Backend environment variables
│   ├── package.json         # Backend dependencies
│   └── server.js            # Express server entry point
├── public/                  # Static frontend assets
├── src/                     # React Frontend Source Code
│   ├── components/          # Reusable UI (Navbar, Layout, TagUsersModal, etc.)
│   ├── context/             # AuthContext for Firebase auth state
│   ├── pages/               # App Views (Dashboard, MyPhotos, EventDetails, etc.)
│   ├── App.jsx              # React Router setup
│   ├── firebase.js          # Firebase configuration & initialization
│   └── main.jsx             # React DOM entry point
├── .env                     # Frontend environment variables (Vite)
├── index.html               # Main HTML template
├── package.json             # Frontend dependencies
└── vite.config.js           # Vite configuration

```

## ⚙️ Installation & Setup

### Clone Repository

```bash
git clone https://github.com/AyushDhaker/SnapShare.git
cd SnapShare
```

### Frontend Setup

```bash
npm install
npm run dev
```

### Backend Setup

```bash
cd backend
npm install
npm start
```

### Environment Variables

Create a `.env` file inside the backend folder:

```env
PORT=5000
AWS_REGION=your-region
AWS_ACCESS_KEY_ID=your-key
AWS_SECRET_ACCESS_KEY=your-secret
AWS_BUCKET_NAME=your-bucket
```

Configure Firebase Admin credentials and Firestore access before starting the backend server.



## 🚀 Live Demo

Frontend: https://snap-share-orpin.vercel.app/

Backend: https://snapshare-backend-zqhh.onrender.com


## 🔮 Future Enhancements

- Mobile Application Support
- Advanced Face Clustering
- Event Analytics Dashboard
- AI-based Photo Recommendations
- Multi-Club Management
- QR-based Event Access


