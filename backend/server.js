const express = require('express');
const cors = require('cors');
require('dotenv').config();

const uploadRoutes = require('./routes/uploadRoutes');
const tagRoutes = require('./routes/tagRoutes');
const deleteRoutes = require('./routes/deleteRoutes');
const faceRoutes = require('./routes/faceRoutes'); // <-- NEW

const { setupRekognitionCollection } = require('./config/rekognitionSetup'); // <-- NEW

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());

app.use('/api/upload', uploadRoutes);
app.use('/api/tags', tagRoutes); 
app.use('/api/delete', deleteRoutes);
app.use('/api/faces', faceRoutes); // <-- NEW

app.get('/', (req, res) => {
    res.send("SnapSphere Backend Server is Running Successfully!");
});

app.listen(PORT, async () => {
    console.log(`Server is securely running on port: ${PORT}`);
    await setupRekognitionCollection(); // <-- NEW: Ensure collection exists on boot
});