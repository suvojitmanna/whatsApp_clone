import multer from "multer";
import { v2 as cloudinary } from "cloudinary";
import dotenv from "dotenv";
import fs from "fs";

dotenv.config();

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

const uploadFileToCloudinary = (file) => {
  if (!file) {
    return Promise.reject(new Error("No file uploaded"));
  }

  const isVideo = file.mimetype.startsWith("video");
  const isAudio = file.mimetype.startsWith("audio");
  const isImage = file.mimetype.startsWith("image");

  const options = {
    resource_type: isVideo || isAudio ? "video" : (isImage ? "image" : "auto"),
  };

  return new Promise((resolve, reject) => {
    const uploader = isVideo
      ? cloudinary.uploader.upload_large
      : cloudinary.uploader.upload;

    uploader(file.path, options, (error, result) => {
      if (file.path) {
        fs.unlink(file.path, (err) => {
          if (err) console.error("File delete error:", err);
        });
      }

      if (error) {
        console.error("Cloudinary upload error:", error);
        return reject(error);
      }

      resolve(result);
    });
  });
};

const extractCloudinaryInfo = (url) => {
  if (!url || typeof url !== "string" || !url.includes("cloudinary.com")) {
    return null;
  }
  try {
    const parsed = new URL(url);
    const parts = parsed.pathname.split("/").filter(Boolean);
    if (parts.length < 3) return null;
    const resourceType = parts[1] || "image";

    const uploadIndex = parts.findIndex((p) =>
      ["upload", "authenticated", "private"].includes(p)
    );
    if (uploadIndex === -1) return null;
    const afterUpload = parts.slice(uploadIndex + 1);
    let startIndex = 0;
    while (startIndex < afterUpload.length) {
      const seg = afterUpload[startIndex];
      if (
        /^v\d+$/.test(seg) ||
        seg.includes(",") ||
        seg.startsWith("c_") ||
        seg.startsWith("w_") ||
        seg.startsWith("h_") ||
        seg.startsWith("q_") ||
        seg.startsWith("fl_")
      ) {
        startIndex++;
      } else {
        break;
      }
    }

    const publicIdSegments = afterUpload.slice(startIndex);
    if (publicIdSegments.length === 0) return null;

    const fullPath = decodeURIComponent(publicIdSegments.join("/"));
    const lastDotIndex = fullPath.lastIndexOf(".");
    const publicId =
      lastDotIndex > 0 ? fullPath.substring(0, lastDotIndex) : fullPath;
    const publicIdWithExt = fullPath;

    return { resourceType, publicId, publicIdWithExt };
  } catch (e) {
    console.error("Error extracting Cloudinary info from URL:", e);
    return null;
  }
};

const deleteFileFromCloudinary = async (fileInfo) => {
  if (!fileInfo) return null;

  try {
    let url =
      typeof fileInfo === "string"
        ? fileInfo
        : fileInfo.url ||
          fileInfo.imageOrVideoUrl ||
          fileInfo.mediaUrl ||
          fileInfo.docUrl ||
          fileInfo.fileUrl;

    let publicId =
      typeof fileInfo === "object"
        ? fileInfo.publicId || fileInfo.mediaPublicId
        : null;

    let resourceType =
      typeof fileInfo === "object"
        ? fileInfo.resourceType || fileInfo.mediaResourceType
        : null;

    const parsed = extractCloudinaryInfo(url);
    if (!publicId && parsed) {
      publicId = parsed.publicId;
    }
    if (!resourceType && parsed) {
      resourceType = parsed.resourceType;
    }

    if (!publicId && !parsed?.publicIdWithExt) {
      return null;
    }

    const mainType = resourceType || parsed?.resourceType || "image";
    const baseId = publicId || parsed?.publicId;
    const withExt = parsed?.publicIdWithExt || baseId;
    const candidates = [];
    if (baseId) candidates.push({ id: baseId, type: mainType });
    if (withExt && withExt !== baseId) {
      candidates.push({ id: withExt, type: mainType });
    }

    if (mainType === "raw") {
      if (baseId) candidates.push({ id: baseId, type: "image" });
      if (withExt) candidates.push({ id: withExt, type: "image" });
    } else if (mainType === "image") {
      if (withExt) candidates.push({ id: withExt, type: "raw" });
      if (baseId) candidates.push({ id: baseId, type: "raw" });
    } else if (mainType === "video") {
      if (withExt) candidates.push({ id: withExt, type: "video" });
    }

    for (const candidate of candidates) {
      try {
        const res = await cloudinary.uploader.destroy(candidate.id, {
          resource_type: candidate.type,
          invalidate: true,
        });

        if (res && res.result === "ok") {
          console.log(
            `[Cloudinary] Successfully deleted asset: ${candidate.id} (${candidate.type})`
          );
          return { success: true, result: res, candidate };
        }
      } catch (destroyErr) {
      }
    }

    console.warn(
      `[Cloudinary] Asset not found for deletion across candidate types: ${baseId || withExt}`
    );
    return { success: false, notFound: true };
  } catch (err) {
    console.error("[Cloudinary] Error in deleteFileFromCloudinary:", err);
    return { success: false, error: err };
  }
};

const deleteMultipleFilesFromCloudinary = async (filesList) => {
  if (!Array.isArray(filesList) || filesList.length === 0) return [];
  return Promise.allSettled(
    filesList.filter(Boolean).map((file) => deleteFileFromCloudinary(file))
  );
};

const multerMiddleware = multer({
  dest: "uploads/",
}).single("media");

export {
  cloudinary,
  uploadFileToCloudinary,
  deleteFileFromCloudinary,
  deleteMultipleFilesFromCloudinary,
  extractCloudinaryInfo,
  multerMiddleware,
};

export default {
  cloudinary,
  uploadFileToCloudinary,
  deleteFileFromCloudinary,
  deleteMultipleFilesFromCloudinary,
  extractCloudinaryInfo,
  multerMiddleware,
};
