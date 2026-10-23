import express from "express";
import * as statusController from "../controllers/statusController.js";
import authMiddleware from "../middleware/authMiddleware.js";
import multer from "multer";

const router = express.Router();
const upload = multer({ dest: "uploads/", });

router.post("/", authMiddleware, upload.single("media"), statusController.createStatus,);
router.get("/", authMiddleware, statusController.getStatuses);
router.put("/:statusId/view", authMiddleware, statusController.viewStatus);
router.delete("/:statusId", authMiddleware, statusController.deleteStatus);
router.put("/:statusId/reaction", authMiddleware, statusController.statusReaction);

export default router;
