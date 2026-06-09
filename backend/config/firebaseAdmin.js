const admin = require("firebase-admin");

let serviceAccount;

try {
    // 1. First, try to load the local file (This works on your localhost)
    serviceAccount = require("./serviceAccountKey.json");
} catch (error) {
    // 2. If the file is missing (like on Render), look for the Environment Variable
    if (process.env.FIREBASE_SERVICE_ACCOUNT) {
        try {
            // Parse the stringified JSON from Render's environment variables
            serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT);
        } catch (parseError) {
            console.error("CRITICAL: Failed to parse FIREBASE_SERVICE_ACCOUNT env variable.");
            throw parseError;
        }
    } else {
        throw new Error("CRITICAL: Missing Firebase credentials. Ensure serviceAccountKey.json exists locally or FIREBASE_SERVICE_ACCOUNT is set in Render.");
    }
}

// Initialize the Firebase Admin App
if (!admin.apps.length) {
    admin.initializeApp({
        credential: admin.credential.cert(serviceAccount)
    });
}

const db = admin.firestore();

module.exports = { admin, db };