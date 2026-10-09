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

    content: String,
    imageOrVideoUrl: String,

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
    statusId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Status",
      default: null,
    },
  },
  { timestamps: true },
);

module.exports =
  mongoose.models.Message || mongoose.model("Message", messageSchema);
