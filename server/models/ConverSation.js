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
    deletedFor: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
      },
    ],
    disappearingDuration: {
      type: String,
      default: "Off",
    },
    disappearingSetBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
    disappearingUpdatedAt: {
      type: Date,
    },
    pinnedMessage: {
      message: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Message",
      },
      pinnedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
      },
      duration: {
        type: String,
        default: "7 days",
      },
      pinnedAt: {
        type: Date,
      },
      expiresAt: {
        type: Date,
      },
    },
  },
  { timestamps: true },
);

conversationSchema.index({ participants: 1, updatedAt: -1 });

const Conversation =
  mongoose.models.Conversation ||
  mongoose.model("Conversation", conversationSchema);

module.exports = Conversation;
