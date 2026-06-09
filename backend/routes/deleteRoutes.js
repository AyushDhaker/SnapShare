const express = require("express");
const router = express.Router();
const { deleteMedia, deleteEventCascade } = require("../controllers/deleteController");

// DELETE /api/delete/media/:mediaId
router.delete("/media/:mediaId", deleteMedia);

// DELETE /api/delete/event/:eventId
router.delete("/event/:eventId", deleteEventCascade);

module.exports = router;