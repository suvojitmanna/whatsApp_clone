const mongoose = require("mongoose");

const conversationSchema = new mongoose.Schema(
  {
    participants: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],
    lastMessage: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Message",
    },
    unreadCount: {
      type: Number, 
      default: 0,
    },
  },
  { timestamps: true },
);

// Model
const Conversation = mongoose.model("Conversation", conversationSchema);

// Export model (IMPORTANT)
module.exports = Conversation;
