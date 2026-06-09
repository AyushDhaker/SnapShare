const { S3Client, PutObjectCommand } = require("@aws-sdk/client-s3");
const { IndexFacesCommand, DeleteFacesCommand } = require("@aws-sdk/client-rekognition");
const { db } = require("../config/firebaseAdmin");
const { rekognitionClient } = require("../config/rekognitionSetup");
const { v4: uuidv4 } = require("uuid");

const s3 = new S3Client({
    region: process.env.AWS_REGION || "us-east-1",
    credentials: {
        accessKeyId: process.env.AWS_ACCESS_KEY_ID,
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
    }
});

const registerFace = async (req, res) => {
    try {
        const { uid } = req.body;
        const file = req.file;

        if (!uid || !file) return res.status(400).json({ error: "Missing user ID or image file." });

        // 1. Check for existing face profile to replace/cleanup
        const existingProfile = await db.collection("faceProfiles").doc(uid).get();
        if (existingProfile.exists) {
            const oldFaceId = existingProfile.data().faceId;
            try {
                await rekognitionClient.send(new DeleteFacesCommand({
                    CollectionId: "SnapSphereFaces",
                    FaceIds: [oldFaceId]
                }));
            } catch (e) { console.warn("[AWS] Failed to delete old face record:", e.message); }
        }

        // 2. Index Face in Rekognition directly using the image buffer
        const indexCommand = new IndexFacesCommand({
            CollectionId: "SnapSphereFaces",
            Image: { Bytes: file.buffer },
            MaxFaces: 2, // Check if multiple faces exist
            QualityFilter: "HIGH"
        });

        const indexResponse = await rekognitionClient.send(indexCommand);

        if (indexResponse.FaceRecords.length === 0) {
            return res.status(400).json({ error: "No face detected. Please upload a clear selfie." });
        }
        if (indexResponse.FaceRecords.length > 1) {
            return res.status(400).json({ error: "Multiple faces detected. Please ensure only your face is in the frame." });
        }

        const faceId = indexResponse.FaceRecords[0].Face.FaceId;

        // 3. Upload Selfie to S3
        const fileExtension = file.originalname.split('.').pop();
        const s3Key = `selfies/${uid}-${uuidv4()}.${fileExtension}`;
        
        await s3.send(new PutObjectCommand({
            Bucket: process.env.AWS_BUCKET_NAME,
            Key: s3Key,
            Body: file.buffer,
            ContentType: file.mimetype
        }));

        const selfieUrl = `https://${process.env.AWS_BUCKET_NAME}.s3.${process.env.AWS_REGION || "us-east-1"}.amazonaws.com/${s3Key}`;

        // 4. Save to Firestore
        await db.collection("faceProfiles").doc(uid).set({
            userId: uid,
            faceId: faceId,
            selfieUrl: selfieUrl,
            createdAt: new Date().toISOString()
        });

        return res.status(200).json({ success: true, faceId, selfieUrl });

    } catch (error) {
        console.error("Face Registration Error:", error);
        res.status(500).json({ error: "Internal server error during face registration." });
    }
};

module.exports = { registerFace };