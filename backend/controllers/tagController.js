// backend/controllers/tagController.js

const { DetectLabelsCommand, DetectFacesCommand, SearchFacesByImageCommand } = require("@aws-sdk/client-rekognition");
const axios = require("axios");
const sharp = require("sharp");
const { db } = require("../config/firebaseAdmin");
const { rekognitionClient } = require("../config/rekognitionSetup");

const processImageTags = async (req, res) => {
    const { mediaId, mediaUrl } = req.body;
    if (!mediaId || !mediaUrl) return res.status(400).json({ error: "Missing data" });

    try {
        // Fetch the image directly into memory
        const response = await axios.get(mediaUrl, { responseType: "arraybuffer" });
        const imageBytes = Buffer.from(response.data);

        // ==========================================
        // 1. OBJECT & SCENE TAGGING (Preserved)
        // ==========================================
        const labelCommand = new DetectLabelsCommand({
            Image: { Bytes: imageBytes },
            MaxLabels: 20, MinConfidence: 75
        });
        const labelData = await rekognitionClient.send(labelCommand);
        const rawLabels = labelData.Labels.map(l => l.Name.toLowerCase());
        const uniqueLabels = [...new Set(rawLabels)].slice(0, 10);

        // ==========================================
        // 2. MULTI-FACE RECOGNITION PIPELINE
        // ==========================================
        let matchedFaceIds = [];

        // A. Detect ALL faces in the image
        const detectFacesCommand = new DetectFacesCommand({
            Image: { Bytes: imageBytes }
        });
        const facesData = await rekognitionClient.send(detectFacesCommand);
        
        console.log(`\n[AI Face Detection] Found ${facesData.FaceDetails.length} face(s) in media ${mediaId}`);

        if (facesData.FaceDetails.length > 0) {
            // Get original image metadata for accurate cropping math
            const metadata = await sharp(imageBytes).metadata();
            const imgWidth = metadata.width;
            const imgHeight = metadata.height;

            // B. Loop through every detected face and extract it
            for (let i = 0; i < facesData.FaceDetails.length; i++) {
                const face = facesData.FaceDetails[i];
                const box = face.BoundingBox;
                
                // Calculate absolute pixel coordinates
                let left = Math.floor(Math.max(0, box.Left) * imgWidth);
                let top = Math.floor(Math.max(0, box.Top) * imgHeight);
                let width = Math.ceil(Math.min(1, box.Width) * imgWidth);
                let height = Math.ceil(Math.min(1, box.Height) * imgHeight);

                // Clamp dimensions strictly to image boundaries to prevent extraction errors
                if (left + width > imgWidth) width = imgWidth - left;
                if (top + height > imgHeight) height = imgHeight - top;

                try {
                    // Crop the specific face into a new buffer
                    const faceCropBuffer = await sharp(imageBytes)
                        .extract({ left, top, width, height })
                        .toBuffer();

                    // C. Search the Rekognition Collection using ONLY this isolated face
                    const searchCommand = new SearchFacesByImageCommand({
                        CollectionId: "SnapSphereFaces",
                        Image: { Bytes: faceCropBuffer },
                        FaceMatchThreshold: 90,
                        MaxFaces: 1
                    });

                    const searchData = await rekognitionClient.send(searchCommand);

                    if (searchData.FaceMatches && searchData.FaceMatches.length > 0) {
                        const match = searchData.FaceMatches[0];
                        console.log(`   -> Face ${i + 1}: MATCH FOUND! Similarity: ${match.Similarity.toFixed(2)}%, FaceId: ${match.Face.FaceId}`);
                        matchedFaceIds.push(match.Face.FaceId);
                    } else {
                        console.log(`   -> Face ${i + 1}: No match in collection.`);
                    }

                } catch (cropErr) {
                    console.error(`   -> Face ${i + 1}: Error processing crop or search:`, cropErr.message);
                    // Safe continue: if one face crop fails, the loop will process the rest
                }
            }
        }

        // ==========================================
        // 3. MAP FACE IDs TO USER IDs
        // ==========================================
        const matchedUserIds = new Set();
        
        // Remove duplicate FaceIds in case the exact same person appears twice/glitches
        const uniqueFaceIds = [...new Set(matchedFaceIds)]; 

        if (uniqueFaceIds.length > 0) {
            // Firestore 'in' queries have a maximum limit of 10 items.
            // We chunk the array to safely handle photos with >10 recognized faces.
            for (let i = 0; i < uniqueFaceIds.length; i += 10) {
                const chunk = uniqueFaceIds.slice(i, i + 10);
                const profilesSnap = await db.collection("faceProfiles").where("faceId", "in", chunk).get();
                
                profilesSnap.forEach(doc => {
                    matchedUserIds.add(doc.data().userId);
                    console.log(`   -> [Mapped] FaceId ${doc.data().faceId} belongs to UID: ${doc.data().userId}`);
                });
            }
        }

        const finalMatchedUsers = Array.from(matchedUserIds);

        // ==========================================
        // 4. UPDATE FIRESTORE MEDIA DOCUMENT
        // ==========================================
        await db.collection("media").doc(mediaId).update({
            tags: uniqueLabels,
            matchedUsers: finalMatchedUsers
        });

        console.log(`[AI Processing Complete] Tags Generated: ${uniqueLabels.length} | Recognized Users Saved: ${finalMatchedUsers.length}\n`);
        
        return res.status(200).json({ 
            success: true, 
            tags: uniqueLabels, 
            matchedUsers: finalMatchedUsers 
        });

    } catch (error) {
        console.error(`[AI Tagging Fatal Error]`, error);
        return res.status(500).json({ error: "Failed to generate AI metadata." });
    }
};

module.exports = { processImageTags };