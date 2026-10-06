const express = require("express");
const statusController = require("../controllers/statusController.js");
const authMiddleware = require("../middleware/authMiddleware.js");
const multer = require("multer");

const router = express.Router();
const upload = multer({ dest: "uploads/", });

router.post("/", authMiddleware, upload.single("media"), statusController.createStatus,);
router.get("/", authMiddleware, statusController.getStatuses);
router.put("/:statusId/view", authMiddleware, statusController.viewStatus);
router.delete("/:statusId", authMiddleware, statusController.deleteStatus);
router.put("/:statusId/reaction", authMiddleware, statusController.statusReaction);

module.exports = router;
