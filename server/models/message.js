const mongoose = require("mongoose");

const messageSchema = new mongoose.Schema(
  {
    conversation: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Conversation",
      required: true,
    },
    sender: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    receiver: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    deletedFor: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
      },
    ],
    deletedForEveryone: {
      type: Boolean,
      default: false,
    },
    blockedDelivery: {
      type: Boolean,
      default: false,
    },

    content: String,
    imageOrVideoUrl: String,
    mediaPublicId: {
      type: String,
      default: null,
    },
    mediaResourceType: {
      type: String,
      default: null,
    },

    contentType: {
      type: String,
      enum: [
        "text",
        "image",
        "video",
        "document",
        "audio",
        "contact",
        "poll",
        "event",
        "sticker",
        "call",
        "call_link",
      ],
      default: "text",
    },
    isEncrypted: {
      type: Boolean,
      default: false,
    },
    iv: {
      type: String,
      default: null,
    },
    fileName: String,
    fileSize: String,
    pollData: {
      question: String,
      options: [
        {
          text: String,
          votes: [
            {
              type: mongoose.Schema.Types.ObjectId,
              ref: "User",
            },
          ],
        },
      ],
      allowMultiple: {
        type: Boolean,
        default: false,
      },
    },
    contactData: {
      name: String,
      phoneNumber: String,
      email: String,
      avatar: String,
    },
    eventData: {
      type: mongoose.Schema.Types.Mixed,
      default: {},
    },
    callData: {
      type: mongoose.Schema.Types.Mixed,
      default: null,
    },
    callLinkData: {
      type: mongoose.Schema.Types.Mixed,
      default: null,
    },
    edited: {
      type: Boolean,
      default: false,
    },

    editedAt: {
      type: Date,
      default: null,
    },

    reactions: [
      {
        userId: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "User",
        },
        emoji: String,
      },
    ],

    messageStatus: {
      type: String,
      enum: ["send", "delivered", "read"],
      default: "send",
    },
    deliveredAt: {
      type: Date,
      default: null,
    },
    readAt: {
      type: Date,
      default: null,
    },
    statusId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Status",
      default: null,
    },
    replyTo: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Message",
      default: null,
    },
    replyMessage: {
      type: mongoose.Schema.Types.Mixed,
      default: null,
    },
    isDisappearing: {
      type: Boolean,
      default: false,
    },
    disappearingDuration: {
      type: String,
      default: null,
    },
    disappearingExpiresAt: {
      type: Date,
      default: null,
    },
    isKept: {
      type: Boolean,
      default: false,
    },
  },
  { timestamps: true },
);

messageSchema.index({ conversation: 1, createdAt: 1 });
messageSchema.index({ conversation: 1, receiver: 1, messageStatus: 1 });
messageSchema.index({ conversation: 1, disappearingExpiresAt: 1 });

module.exports =
  mongoose.models.Message || mongoose.model("Message", messageSchema);
