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

    // ✅ FIXED HERE
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
  },
  { timestamps: true }
);

module.exports = mongoose.model("Status", statusSchema);