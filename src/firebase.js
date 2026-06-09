import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyCjCi7RVf7rPyyJqQXPJWOKGSh3ZwflL_E",
  authDomain: "snapfind-ai.firebaseapp.com",
  projectId: "snapfind-ai",
  storageBucket: "snapfind-ai.firebasestorage.app",
  messagingSenderId: "525331280322",
  appId: "1:525331280322:web:2346ad7224b96f62cb265b"
};

const app = initializeApp(firebaseConfig);

export const auth = getAuth(app);
export const db = getFirestore(app);

export default app;