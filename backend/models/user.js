const mongoose = require("mongoose");

const userSchema = new mongoose.Schema(
  {
    phoneNumber: { type: String, unique: true, sparse: true },
    phoneSuffix: { type: String, unique: true, sparse: true },

    email: {
      type: String,
      lowercase: true,
      validate: {
        validator: function (v) {
          return /^\S+@\S+\.\S+$/.test(v);
        },
        message: "Invalid email address format",
      },
    },

    emailOtp: { type: String },
    emailOtpExpire: { type: Date },

    username: {
      type: String,
      trim: true,
      required: true,
    },

    profilePicture: { type: String },
    about: { type: String },

    lastSeen: { type: Date, default: Date.now },

    isOnline: { type: Boolean, default: false },
    isVerified: { type: Boolean, default: false },
    agreed: { type: Boolean, default: false },
  },
  { timestamps: true },
);

// prevent overwrite error
module.exports = mongoose.models.User || mongoose.model("User", userSchema);
