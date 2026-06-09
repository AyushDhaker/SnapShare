const { RekognitionClient, CreateCollectionCommand, ListCollectionsCommand } = require("@aws-sdk/client-rekognition");

const rekognitionClient = new RekognitionClient({ region: process.env.AWS_REGION || "us-east-1" });

const setupRekognitionCollection = async () => {
    try {
        const listCommand = new ListCollectionsCommand({});
        const { CollectionIds } = await rekognitionClient.send(listCommand);
        
        if (!CollectionIds.includes("SnapSphereFaces")) {
            console.log("[AWS] Creating Rekognition Collection: SnapSphereFaces...");
            const createCommand = new CreateCollectionCommand({ CollectionId: "SnapSphereFaces" });
            await rekognitionClient.send(createCommand);
            console.log("[AWS] Collection SnapSphereFaces created successfully.");
        } else {
            console.log("[AWS] Rekognition Collection 'SnapSphereFaces' is ready.");
        }
    } catch (error) {
        console.error("[AWS] Error setting up Rekognition Collection:", error);
    }
};

module.exports = { setupRekognitionCollection, rekognitionClient };