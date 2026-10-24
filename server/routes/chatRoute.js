import express from "express";
import * as chatController from "../controllers/chatController.js";
import authMiddleware from "../middleware/authMiddleware.js";
import { multerMiddleware } from "../config/cloudinary.js";

const router = express.Router();

router.post(
  "/send-message",
  authMiddleware,
  multerMiddleware,
  chatController.sendMessage,
);
router.post(
  "/group",
  authMiddleware,
  multerMiddleware,
  chatController.createGroup,
);
router.put(
  "/group/:conversationId",
  authMiddleware,
  multerMiddleware,
  chatController.updateGroup,
);
router.get(
  "/group/:conversationId/member-changes",
  authMiddleware,
  chatController.getMemberChanges,
);
router.get("/conversation", authMiddleware, chatController.getConversation);
router.get(
  "/conversation/:conversationId/messages",
  authMiddleware,
  chatController.getMessages,
);
router.put("/messages/read", authMiddleware, chatController.markAsRead);
router.delete(
  "/messages/:messageId",
  authMiddleware,
  chatController.deleteMessage,
);
router.post(
  "/messages/:messageId/send-now",
  authMiddleware,
  chatController.sendScheduledNow,
);
router.put("/messages/:messageId", authMiddleware, chatController.editMessage);
router.post(
  "/messages/:messageId/vote",
  authMiddleware,
  chatController.votePoll,
);
router.post("/block-user", authMiddleware, chatController.blockUser);
router.post("/unblock-user", authMiddleware, chatController.unblockUser);
router.get("/blocked-users", authMiddleware, chatController.getBlockedUsers);
router.post("/clear-chat", authMiddleware, chatController.clearChat);
router.post("/delete-chat", authMiddleware, chatController.deleteChat);
router.get("/media", authMiddleware, chatController.getChatMedia);
router.put(
  "/conversation/:conversationId/disappearing",
  authMiddleware,
  chatController.setDisappearingDuration,
);
router.post(
  "/disappearing-duration",
  authMiddleware,
  chatController.setDisappearingDuration,
);
router.post("/meta-ai", authMiddleware, chatController.askMetaAi);
router.post("/summarize", authMiddleware, chatController.summarizeConversation);
router.post("/translate", authMiddleware, chatController.translateText);
router.post("/smart-replies", authMiddleware, chatController.getSmartReplies);
router.post("/magic-rewrite", authMiddleware, chatController.magicRewrite);
router.post(
  "/transcribe-audio",
  authMiddleware,
  chatController.transcribeAudio,
);
router.post("/analyze-image", authMiddleware, chatController.analyzeImage);

export default router;
