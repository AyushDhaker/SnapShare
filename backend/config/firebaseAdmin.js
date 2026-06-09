const admin = require("firebase-admin");
const serviceAccount = require("./serviceAccountKey.json");

console.log("Firebase Project:", serviceAccount.project_id);
console.log("Firebase Email:", serviceAccount.client_email);

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});

const db = admin.firestore();

module.exports = { admin, db };