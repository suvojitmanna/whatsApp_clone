const { uploadFileToCloudinary } = require("../config/cloudinary");
const response = require("../utils/responseHandeler.js");
const Message = require("../models/Message.js");
const Status = require("../models/status.js");

exports.createStatus = async (req, res) => {
  try {
    const { content, contentType, expireAt: inputExpireAt } = req.body;
    console.log("BODY:", req.body);
    console.log("FILE:", req.file);
    const file = req.file;
    const userId = req.user.userId;

    let mediaUrl = null;
    let finalContentType = contentType || "text";

    // File upload handling
    if (file) {
      const uploadFile = await uploadFileToCloudinary(file);
      mediaUrl = uploadFile?.secure_url;

      if (file.mimetype.startsWith("image")) {
        finalContentType = "image";
      } else if (file.mimetype.startsWith("video")) {
        finalContentType = "video";
      } else {
        return response(res, 400, "Unsupported file type");
      }
    } else if (content?.trim()) {
      finalContentType = "text";
    } else {
      return response(res, 400, "Content is required");
    }

    // Expire time (24 hours default)
    const expireAt = inputExpireAt
      ? new Date(inputExpireAt)
      : new Date(Date.now() + 24 * 60 * 60 * 1000);

    // Create status
    const status = new Status({
      user: userId,
      content: mediaUrl ? null : content,
      mediaUrl,
      contentType: finalContentType,
      expireAt,
    });

    await status.save();

    // Populate correctly
    const populatedStatus = await Status.findById(status._id)
      .populate("user", "username profilePicture")
      .populate("viewers", "username profilePicture");

    // Emit new status to followers (for simplicity, emitting to all users)
    if (req.io && req.socketUserMap) {
      for (const [connectedUserId, socketId] of req.socketUserMap) {
        if (connectedUserId !== userId) {
          req.io.to(socketId).emit("new_status", populatedStatus);
        }
      }
    }
    return response(res, 201, "Status created successfully", populatedStatus);
  } catch (error) {
    console.error(error);
    return response(res, 500, "Internal server error");
  }
};

exports.getStatuses = async (req, res) => {
  try {
    const userId = req.user.userId;

    const statuses = await Status.find({
      expireAt: { $gt: new Date() },
    })
      .populate("user", "username profilePicture")
      .populate("viewers.user", "username profilePicture")
      .sort({ createdAt: -1 });

    return response(res, 200, "Statuses retrieved successfully", statuses);
  } catch (error) {
    console.error(error);
    return response(res, 500, "Internal server error");
  }
};

exports.viewStatus = async (req, res) => {
  const { statusId } = req.params;
  const userId = req.user.userId;

  try {
    const status = await Status.findById(statusId);

    if (!status) {
      return response(res, 404, "Status not found");
    }

    //  FIX: check inside viewer.user
    const alreadyViewed = status.viewers.some(
      (v) => v.user.toString() === userId,
    );

    //  FIX: push correct structure
    if (!alreadyViewed) {
      status.viewers.push({ user: userId });
      await status.save();
    }

    //  FIX: correct populate
    const updatedStatus = await Status.findById(statusId)
      .populate("user", "username profilePicture")
      .populate("viewers.user", "username profilePicture");

    //  Socket emit
    if (req.io && req.socketUserMap) {
      const statusOwnerSocketId = req.socketUserMap.get(status.user.toString());

      if (statusOwnerSocketId) {
        req.io.to(statusOwnerSocketId).emit("status_view", {
          statusId,
          viewerId: userId,
          totalViews: updatedStatus.viewers.length,
          viewers: updatedStatus.viewers,
        });
      }
    }

    return response(res, 200, "Status viewed successfully", updatedStatus);
  } catch (error) {
    console.error(error);
    return response(res, 500, "Internal server error");
  }
};

exports.deleteStatus = async (req, res) => {
  const { statusId } = req.params;
  const userId = req.user.userId;

  try {
    const status = await Status.findById(statusId);

    if (!status) {
      return response(res, 404, "Status not found");
    }

    if (status.user.toString() !== userId) {
      return response(res, 403, "Unauthorized to delete this status");
    }

    await Status.deleteOne({ _id: statusId });

    if (req.io && req.socketUserMap) {
      for (const [connectedUserId, socketId] of req.socketUserMap) {
        if (connectedUserId !== userId) {
          req.io.to(socketId).emit("status_deleted", statusId);
        }
      }
    }

    return response(res, 200, "Status deleted successfully");
  } catch (error) {
    console.error(error);
    return response(res, 500, "Internal server error");
  }
};
