const User = require("../models/user");
const sendOtpToEmail = require("../services/emailService");
const otpGenerate = require("../utils/otpGenerator");
const response = require("../utils/responseHandeler");
const twilloService = require("../services/twilloService.js");
const generateToken = require("../utils/generateToken.js");
const { uploadFileToCloudinary } = require("../config/cloudinary.js");
const Conversation = require("../models/ConverSation.js");

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
    }
    else {
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
    console.log("REQ BODY:", req.body);
    console.log("ABOUT:", req.body.about);
    const file = req.file;

    if (file) {
      const uploadResult = await uploadFileToCloudinary(file);
      user.profilePicture = uploadResult.secure_url;
    } else if (req.body.profilePicture) {
      user.profilePicture = req.body.profilePicture;
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
    }
    );
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

    const loggedInUserId = req.user.userId;
    const users = await User.find({
      _id: { $ne: loggedInUserId },
    })
      .select(
        "username profilePicture lastSeen isOnline phoneSuffix phoneNumber phoneSuffix about aboutUpdatedAt email",
      )
      .lean();

    const conversations = await Conversation.find({
      participants: { $in: [loggedInUserId] },
    })
      .populate({
        path: "lastMessage",
        select: "content sender receiver createdAt",
      })
      .lean();
    const conversationMap = {};

    conversations.forEach((conv) => {
      const otherUserId = conv.participants.find(
        (id) => id.toString() !== loggedInUserId.toString(),
      );

      if (otherUserId) {
        conversationMap[otherUserId.toString()] = conv;
      }
    });

    const usersWithConversations = users.map((user) => ({
      ...user,
      conversation: conversationMap[user._id.toString()] || null,
    }));

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

module.exports = {
  sendOtp,
  verifyOtp,
  updateProfile,
  logout,
  checkAuthenticated,
  getAllUsers,
};
