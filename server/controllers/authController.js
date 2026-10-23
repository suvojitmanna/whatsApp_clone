import User from "../models/user.js";
import sendOtpToEmail from "../services/emailService.js";
import otpGenerate from "../utils/otpGenerator.js";
import response from "../utils/responseHandeler.js";
import twilloService from "../services/twilloService.js";
import generateToken from "../utils/generateToken.js";
import {
  uploadFileToCloudinary,
  deleteFileFromCloudinary,
} from "../config/cloudinary.js";
import Conversation from "../models/ConverSation.js";
import Message from "../models/message.js";
import mongoose from "mongoose";
import { ensureMetaAiUser } from "../services/aiService.js";

const sendOtp = async (req, res) => {
  const { phoneNumber, phoneSuffix, email } = req.body;

  const { otp } = otpGenerate();
  const expiry = new Date(Date.now() + 5 * 60 * 1000);
  let user;
  try {
    if (email) {
      user = await User.findOne({ email });
      if (!user) {
        user = new User({
          email,
          username: email.split("@")[0],
          about: "Hey there! I am using WhatsApp.",
        });
      }
      user.emailOtp = otp;
      user.emailOtpExpire = expiry;
      await user.save();
      await sendOtpToEmail(email, otp);

      return response(res, 200, "OTP sent to your email", { email });
    }
    if (!phoneNumber || !phoneSuffix) {
      return response(res, 400, "Phone number and suffix are required");
    }

    const fullPhoneNumber = `${phoneSuffix}${phoneNumber}`;
    user = await User.findOne({ phoneNumber: fullPhoneNumber });

    if (!user) {
      user = new User({
        phoneNumber: fullPhoneNumber,
        username: "user_" + fullPhoneNumber.slice(-6),
        about: "Hey there! I am using WhatsApp.",
      });
    }

    user.phoneOtp = otp;
    user.phoneOtpExpire = expiry;
    await user.save();
    await twilloService.sendOtpToPhoneNumber(fullPhoneNumber);

    return response(res, 200, "OTP sent successfully", {
      phoneNumber: fullPhoneNumber,
    });
  } catch (error) {
    console.error(error);
    return response(res, 500, "Internal server error");
  }
};

const verifyOtp = async (req, res) => {
  const { phoneNumber, phoneSuffix, email, otp } = req.body;
  try {
    let user;
    if (email) {
      user = await User.findOne({ email });
      if (!user) {
        return response(res, 404, "User not found");
      }
      const now = new Date();
      if (
        !user.emailOtp ||
        String(user.emailOtp) !== String(otp) ||
        now > new Date(user.emailOtpExpire)
      ) {
        return response(res, 400, "Invalid or expired OTP");
      }
      user.isVerified = true;
      user.emailOtp = null;
      user.emailOtpExpire = null;
      await user.save();
    } else {
      if (!phoneNumber || !phoneSuffix) {
        return response(res, 400, "Phone number and suffix are required");
      }
      const fullPhoneNumber = `${phoneSuffix}${phoneNumber}`;
      user = await User.findOne({ phoneNumber: fullPhoneNumber });
      if (!user) {
        return response(res, 404, "User not found");
      }
      const result = await twilloService.verifyOtp(fullPhoneNumber, otp);
      if (result.status !== "approved") {
        return response(res, 400, "Invalid OTP");
      }

      user.isVerified = true;
      await user.save();
    }

    const token = generateToken(user?._id);

    res.cookie("auth_token", token, {
      httpOnly: true,
      secure: true,
      sameSite: "none",
      maxAge: 1000 * 60 * 60 * 24 * 365,
    });

    return response(res, 200, "OTP verified successfully", {
      token,
      user,
    });
  } catch (error) {
    console.error(error);
    return response(res, 500, "Internal server error");
  }
};

const updateProfile = async (req, res) => {
  const { username, agreed, about } = req.body;
  const userId = req.user.userId;

  try {
    const user = await User.findById(userId);
    if (!user) {
      return response(res, 404, "User not found");
    }
    const file = req.file;
    const oldPic = user.profilePicture;
    if (file) {
      const uploadResult = await uploadFileToCloudinary(file);
      user.profilePicture = uploadResult.secure_url;
      if (
        oldPic &&
        oldPic !== user.profilePicture &&
        oldPic.includes("cloudinary.com")
      ) {
        deleteFileFromCloudinary(oldPic).catch((e) =>
          console.error("Cloudinary old avatar delete error:", e),
        );
      }
    } else if (req.body.profilePicture !== undefined) {
      user.profilePicture = req.body.profilePicture;
      if (
        oldPic &&
        oldPic !== user.profilePicture &&
        oldPic.includes("cloudinary.com")
      ) {
        deleteFileFromCloudinary(oldPic).catch((e) =>
          console.error("Cloudinary old avatar delete error:", e),
        );
      }
    }
    if (username !== undefined) {
      user.username = username;
    }
    if (agreed !== undefined) {
      user.agreed = agreed;
    }

    if (about !== undefined && about !== null) {
      const newAbout = String(about).trim();

      if (newAbout !== user.about) {
        user.about = newAbout;
        user.aboutUpdatedAt = new Date();
      }
    }

    if (!user.about) {
      user.about = "Hey there! I am using WhatsApp.";
    }

    await user.save();
    const io = req.app.get("io");

    if (io) {
      io.emit("profile_updated", {
        userId: user._id.toString(),
        username: user.username,
        about: user.about,
        profilePicture: user.profilePicture,
        aboutUpdatedAt: user.aboutUpdatedAt,
      });
    }

    return response(res, 200, "Profile updated successfully", {
      user,
    });
  } catch (error) {
    console.error("UPDATE PROFILE ERROR:", error);
    return response(res, 500, "Internal server error");
  }
};

const checkAuthenticated = async (req, res) => {
  try {
    const userId = req.user.userId;
    if (!userId) {
      return response(res, 401, "Unauthorized");
    }
    const user = await User.findById(userId);
    if (!user) {
      return response(res, 404, "User not found");
    }
    return response(res, 200, "User is authenticated", { user });
  } catch (error) {
    console.error(error);
    return response(res, 500, "Internal server error");
  }
};

const logout = async (req, res) => {
  try {
    res.cookie("auth_token", "", {
      httpOnly: true,
      expires: new Date(0),
    });
    return response(res, 200, "Logged out successfully");
  } catch (error) {
    console.error(error);
    return response(res, 500, "Internal server error");
  }
};

const getAllUsers = async (req, res) => {
  try {
    if (!req.user || !req.user.userId) {
      console.log("Unauthorized access");
      return res.status(401).json({
        message: "Unauthorized",
      });
    }

    await ensureMetaAiUser().catch((err) =>
      console.error("ensureMetaAiUser err:", err),
    );

    const loggedInUserId = req.user.userId;
    const users = await User.find({
      _id: { $ne: loggedInUserId },
    })
      .select(
        "username profilePicture lastSeen isOnline phoneSuffix phoneNumber about aboutUpdatedAt email publicKey isAI isVerified",
      )
      .lean();

    const conversations = await Conversation.find({
      participants: { $in: [loggedInUserId] },
      deletedFor: { $ne: loggedInUserId },
    })
      .populate({
        path: "lastMessage",
        select:
          "content sender receiver createdAt isEncrypted iv contentType imageOrVideoUrl fileName fileSize pollData contactData eventData edited editedAt deletedFor messageStatus readBy deliveredTo isSystemMessage systemAction",
        populate: {
          path: "sender receiver",
          select: "username profilePicture email phoneNumber publicKey",
        },
      })
      .populate({
        path: "pinnedMessage.message",
        populate: {
          path: "sender receiver",
          select: "username profilePicture email phoneNumber publicKey",
        },
      })
      .populate("pinnedMessage.pinnedBy", "username profilePicture")
      .populate("disappearingSetBy", "username profilePicture")
      .lean();
    const conversationMap = {};

    const directConvIds = conversations
      .filter((c) => !c.isGroup)
      .map((c) => c._id);
    const groupConvIds = conversations
      .filter((c) => c.isGroup)
      .map((c) => c._id);

    const matchConditions = [];
    if (directConvIds.length > 0) {
      matchConditions.push({
        conversation: { $in: directConvIds },
        receiver: new mongoose.Types.ObjectId(loggedInUserId),
        messageStatus: { $in: ["send", "delivered"] },
      });
    }
    if (groupConvIds.length > 0) {
      matchConditions.push({
        conversation: { $in: groupConvIds },
        sender: { $ne: new mongoose.Types.ObjectId(loggedInUserId) },
        "readBy.user": {
          $ne: new mongoose.Types.ObjectId(loggedInUserId),
        },
        isSystemMessage: { $ne: true },
        contentType: { $ne: "system" },
        systemAction: null,
        content: {
          $not: /^(Group ".*" created|.+ added .+|.+ removed .+|.+ changed .+|.+ deleted .+|.+ left the group)$/i,
        },
      });
    }

    let unreadAgg = [];
    if (matchConditions.length > 0) {
      unreadAgg = await Message.aggregate([
        {
          $match: {
            deletedFor: { $ne: new mongoose.Types.ObjectId(loggedInUserId) },
            $or: matchConditions,
          },
        },
        {
          $group: {
            _id: "$conversation",
            count: { $sum: 1 },
          },
        },
      ]);
    }

    const unreadMap = new Map();
    unreadAgg.forEach((item) => {
      unreadMap.set(item._id.toString(), item.count);
    });

    conversations.forEach((conv) => {
      conv.unreadCount = unreadMap.get(conv._id.toString()) || 0;
      if (
        conv.lastMessage &&
        Array.isArray(conv.lastMessage.deletedFor) &&
        conv.lastMessage.deletedFor.some(
          (d) => d.toString() === loggedInUserId.toString(),
        )
      ) {
        conv.lastMessage = null;
      }
      const otherUserId = conv.participants.find(
        (id) => id.toString() !== loggedInUserId.toString(),
      );

      if (otherUserId) {
        conversationMap[otherUserId.toString()] = conv;
      }
    });

    const usersWithConversations = users
      .map((user) => ({
        ...user,
        conversation: conversationMap[user._id.toString()] || null,
      }))
      .sort((a, b) => {
        if (a.isAI || a.username === "Meta AI") return -1;
        if (b.isAI || b.username === "Meta AI") return 1;
        return 0;
      });

    return res.status(200).json({
      message: "Users retrieved successfully",
      users: usersWithConversations,
    });
  } catch (error) {
    console.error("ERROR:", error);
    return res.status(500).json({
      message: "Internal server error",
    });
  }
};

const updatePublicKey = async (req, res) => {
  try {
    const userId = req.user.userId;
    const { publicKey } = req.body;
    if (!publicKey) {
      return response(res, 400, "Public key is required");
    }

    const updatedUser = await User.findByIdAndUpdate(
      userId,
      { publicKey },
      { new: true },
    );

    if (req.io) {
      req.io.emit("user_public_key_updated", {
        userId: updatedUser._id.toString(),
        publicKey: updatedUser.publicKey,
      });
    }

    return response(res, 200, "Public key updated successfully", {
      publicKey: updatedUser.publicKey,
    });
  } catch (error) {
    console.error("Error updating public key:", error);
    return response(res, 500, "Internal server error");
  }
};

const getUserPublicKey = async (req, res) => {
  try {
    const { userId } = req.params;
    if (!userId || !mongoose.Types.ObjectId.isValid(userId)) {
      return response(res, 200, "User public key not available", {
        publicKey: null,
        userId,
      });
    }

    const user = await User.findById(userId).select("publicKey username");
    if (!user) {
      return response(res, 200, "User public key not available", {
        publicKey: null,
        userId,
      });
    }

    return response(res, 200, "User public key retrieved", {
      publicKey: user.publicKey || null,
      userId: user._id,
      username: user.username,
    });
  } catch (error) {
    console.error("Error retrieving user public key:", error);
    return response(res, 500, "Internal server error");
  }
};

export {
  sendOtp,
  verifyOtp,
  updateProfile,
  logout,
  checkAuthenticated,
  getAllUsers,
  updatePublicKey,
  getUserPublicKey,
};

export default {
  sendOtp,
  verifyOtp,
  updateProfile,
  logout,
  checkAuthenticated,
  getAllUsers,
  updatePublicKey,
  getUserPublicKey,
};
