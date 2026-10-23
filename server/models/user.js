import mongoose from "mongoose";

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

    about: {
      type: String,
      default: "Hey there! I am using WhatsApp.",
      maxlength: 139,
      trim: true,
    },
    aboutUpdatedAt: {
      type: Date,
      default: Date.now,
    },

    lastSeen: { type: Date, default: Date.now },

    isOnline: { type: Boolean, default: false },
    isVerified: { type: Boolean, default: false },
    agreed: { type: Boolean, default: false },
    publicKey: { type: String, default: null },
    isAI: { type: Boolean, default: false },
    blockedUsers: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],
  },
  { timestamps: true },
);

const User = mongoose.models.User || mongoose.model("User", userSchema);

export default User;
export { User };
