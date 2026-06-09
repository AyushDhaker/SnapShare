const express = require("express");
const router = express.Router();
const multer = require("multer");
const { registerFace } = require("../controllers/faceController");

// Configure Multer to hold file in memory for direct AWS processing
const upload = multer({ storage: multer.memoryStorage() });

// POST /api/faces/register
router.post("/register", upload.single("selfie"), registerFace);

module.exports = router;