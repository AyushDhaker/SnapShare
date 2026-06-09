const { PutObjectCommand } = require("@aws-sdk/client-s3");
const s3Client = require("../config/aws");

const uploadMedia = async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ success: false, message: "No file uploaded." });
        }

        // Grab the eventId sent from the React frontend, default to "misc" if missing
        const eventId = req.body.eventId || "misc";
        
        // Sanitize the filename to remove spaces
        const originalName = req.file.originalname.replace(/\s+/g, '-');
        const timestamp = Date.now();
        
        // Format: eventId/timestamp-originalname
        const fileKey = `${eventId}/${timestamp}-${originalName}`;

        // Prepare the command to send to AWS S3
        const command = new PutObjectCommand({
            Bucket: process.env.AWS_BUCKET_NAME,
            Key: fileKey,
            Body: req.file.buffer,
            ContentType: req.file.mimetype,
        });

        // Execute upload
        await s3Client.send(command);

        // Construct the public S3 URL
        const uploadedFileUrl = `https://${process.env.AWS_BUCKET_NAME}.s3.${process.env.AWS_REGION}.amazonaws.com/${fileKey}`;

        // Return the exact structure requested
        res.status(200).json({
            success: true,
            url: uploadedFileUrl
        });

    } catch (error) {
        console.error("AWS Upload Error:", error);
        res.status(500).json({ success: false, message: "Failed to upload to AWS S3" });
    }
};

module.exports = { uploadMedia };