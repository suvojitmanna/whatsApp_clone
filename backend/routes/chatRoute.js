const express = require("express");
const chatController = require("../controllers/chatController.js");
const authMiddleware = require("../middleware/authMiddleware.js");
const { multerMiddleware } = require("../config/cloudinary.js");

const router = express.Router();

router.post(
  "/send-message",
  authMiddleware,
  multerMiddleware,
  chatController.sendMessage,
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

module.exports = router;
