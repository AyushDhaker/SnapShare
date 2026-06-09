const express = require("express");
const router = express.Router();
const { processImageTags } = require("../controllers/tagController");

// POST /api/tags/generate
router.post("/generate", processImageTags);

module.exports = router;