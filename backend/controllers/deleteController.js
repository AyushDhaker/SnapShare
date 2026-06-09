const { S3Client, DeleteObjectCommand } = require("@aws-sdk/client-s3");
const { db } = require("../config/firebaseAdmin");

// Initialize AWS S3 Client (v3)
const s3 = new S3Client({
    region: process.env.AWS_REGION || "us-east-1",
    credentials: {
        accessKeyId: process.env.AWS_ACCESS_KEY_ID,
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
    }
});

// Helper to extract the S3 Object Key from a standard S3 URL
const extractS3Key = (url) => {
    try {
        const { pathname } = new URL(url);
        return decodeURIComponent(pathname.substring(1)); // Removes the leading '/'
    } catch (err) {
        console.error("Invalid URL format:", url);
        return null;
    }
};

// ==========================================
// 1. DELETE SINGLE MEDIA
// ==========================================
const deleteMedia = async (req, res) => {
    try {
        const { mediaId } = req.params;
        const { uid } = req.body;

        if (!mediaId || !uid) return res.status(400).json({ error: "Missing mediaId or uid" });

        // 1. Fetch User Role
        const userSnap = await db.collection("users").doc(uid).get();
        const userRole = userSnap.exists ? userSnap.data().role : "Viewer";

        // 2. Fetch Media Document
        const mediaSnap = await db.collection("media").doc(mediaId).get();
        if (!mediaSnap.exists) return res.status(404).json({ error: "Media not found" });
        const mediaData = mediaSnap.data();

        // 3. SECURE AUTHORIZATION: Only Admin or the Original Uploader can delete
        if (userRole !== "Admin" && mediaData.uploadedBy !== uid) {
            return res.status(403).json({ error: "Forbidden: You do not have permission to delete this media." });
        }

        // 4. Delete from AWS S3
        const s3Key = extractS3Key(mediaData.mediaUrl);
        if (s3Key) {
            await s3.send(new DeleteObjectCommand({
                Bucket: process.env.AWS_BUCKET_NAME,
                Key: s3Key
            }));
            console.log(`[S3] Deleted object: ${s3Key}`);
        }

        // 5. Delete from Firestore
        await db.collection("media").doc(mediaId).delete();
        console.log(`[Firestore] Deleted media doc: ${mediaId}`);

        return res.status(200).json({ success: true, message: "Media deleted successfully." });

    } catch (error) {
        console.error("Delete Media Error:", error);
        res.status(500).json({ error: "Internal server error during deletion." });
    }
};

// ==========================================
// 2. EVENT CASCADE DELETE
// ==========================================
const deleteEventCascade = async (req, res) => {
    try {
        const { eventId } = req.params;
        const { uid } = req.body;

        if (!eventId || !uid) return res.status(400).json({ error: "Missing eventId or uid" });

        // 1. SECURE AUTHORIZATION: Only Admins can delete events
        const userSnap = await db.collection("users").doc(uid).get();
        if (!userSnap.exists || userSnap.data().role !== "Admin") {
            return res.status(403).json({ error: "Forbidden: Only Admins can delete events." });
        }

        console.log(`[Cascade Delete] Initiated for Event: ${eventId}`);

        // 2. Fetch all associated media
        const mediaQuery = await db.collection("media").where("eventId", "==", eventId).get();
        
        const failedS3Deletes = [];

        // 3. Iterate and Delete (S3 + Firestore)
        for (const docSnap of mediaQuery.docs) {
            const mediaData = docSnap.data();
            const s3Key = extractS3Key(mediaData.mediaUrl);

            try {
                // Delete from S3
                if (s3Key) {
                    await s3.send(new DeleteObjectCommand({
                        Bucket: process.env.AWS_BUCKET_NAME,
                        Key: s3Key
                    }));
                }
                // Delete from Firestore
                await db.collection("media").doc(docSnap.id).delete();
            } catch (err) {
                console.error(`[S3 Error] Failed to delete key ${s3Key}:`, err);
                failedS3Deletes.push(docSnap.id);
            }
        }

        // 4. Finally, Delete the Event Document itself
        await db.collection("events").doc(eventId).delete();
        console.log(`[Firestore] Deleted event doc: ${eventId}`);

        // 5. Respond with detailed status
        if (failedS3Deletes.length > 0) {
            return res.status(207).json({ 
                success: true, 
                message: "Event deleted, but some media files failed to delete from S3.", 
                failedMediaIds: failedS3Deletes 
            });
        }

        return res.status(200).json({ success: true, message: "Event and all associated media deleted successfully." });

    } catch (error) {
        console.error("Cascade Delete Error:", error);
        res.status(500).json({ error: "Internal server error during event deletion." });
    }
};

module.exports = { deleteMedia, deleteEventCascade };