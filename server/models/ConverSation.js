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
    isGroup: {
      type: Boolean,
      default: false,
    },
    groupName: {
      type: String,
      default: "",
    },
    groupProfileImage: {
      type: String,
      default: "",
    },
    groupAdmin: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
      },
    ],
    groupDescription: {
      type: String,
      default: "",
    },
    groupPermissions: {
      editGroupSettings: { type: Boolean, default: true },
      sendMessages: { type: Boolean, default: true },
      addMembers: { type: Boolean, default: true },
      inviteViaLink: { type: Boolean, default: true },
      sendMessageHistory: { type: Boolean, default: true },
      approveNewMembers: { type: Boolean, default: false },
    },
    memberTags: [
      {
        user: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "User",
        },
        tag: {
          type: String,
          default: "",
          trim: true,
          maxlength: 30,
        },
      },
    ],
    memberChanges: [
      {
        user: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "User",
        },
        action: {
          type: String,
          default: "left",
        },
        actor: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "User",
        },
        text: {
          type: String,
          required: true,
        },
        timestamp: {
          type: Date,
          default: Date.now,
        },
      },
    ],
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
