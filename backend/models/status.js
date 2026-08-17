const mongoose = require("mongoose");

const statusSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    content: {
      type: String,
    },
    mediaUrl: {
      type: String,
    },
    contentType: {
      type: String,
      enum: ["text", "image", "video"],
      default: "text",
    },

    viewers: [
      {
        user: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "User",
        },
        viewedAt: {
          type: Date,
          default: Date.now,
        },
      },
    ],

    reactions: [
      {
        user: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "User",
          required: true,
        },
        like: {
          type: Boolean,
          default: false,
        },
        reactedAt: {
          type: Date,
          default: Date.now,
        },
      },
    ],
    visibility: {
      type: String,
      enum: ["public", "contacts", "private"],
      default: "contacts",
    },
    expireAt: {
      type: Date,
      required: true,
      index: { expires: 0 },
    },
    statusId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Status",
      default: null,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Status", statusSchema);