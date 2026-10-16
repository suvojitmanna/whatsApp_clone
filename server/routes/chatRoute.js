const express = require("express");
const chatController = require("../controllers/chatController.js");
const authMiddleware = require("../middleware/authMiddleware.js");
const { multerMiddleware } = require("../config/cloudinary.js");

const router = express.Router();

router.post("/send-message", authMiddleware, multerMiddleware, chatController.sendMessage,);
router.get("/conversation", authMiddleware, chatController.getConversation);
router.get("/conversation/:conversationId/messages", authMiddleware, chatController.getMessages,);
router.put("/messages/read", authMiddleware, chatController.markAsRead);
router.delete("/messages/:messageId", authMiddleware, chatController.deleteMessage,);
router.put("/messages/:messageId", authMiddleware, chatController.editMessage);
router.post("/messages/:messageId/vote", authMiddleware, chatController.votePoll);
router.post("/block-user", authMiddleware, chatController.blockUser);
router.post("/unblock-user", authMiddleware, chatController.unblockUser);
router.get("/blocked-users", authMiddleware, chatController.getBlockedUsers);
router.post("/clear-chat", authMiddleware, chatController.clearChat);
router.post("/delete-chat", authMiddleware, chatController.deleteChat);
router.get("/media", authMiddleware, chatController.getChatMedia);
router.put("/conversation/:conversationId/disappearing", authMiddleware, chatController.setDisappearingDuration);
router.post("/disappearing-duration", authMiddleware, chatController.setDisappearingDuration);

module.exports = router;
