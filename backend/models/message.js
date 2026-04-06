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

    content: String,
    imageOrVideoUrl: String,

    contentType: {
      type: String,
      enum: ["text", "image", "video"],
      default: "text",
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
  },
  { timestamps: true },
);

// prevent overwrite error
module.exports =
  mongoose.models.Message || mongoose.model("Message", messageSchema);
