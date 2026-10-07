const multer = require("multer");
const cloudinary = require("cloudinary").v2;
require("dotenv").config();
const fs = require("fs");

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

const multerMiddleware = multer({
  dest: "uploads/",
}).single("media");

module.exports = {
  uploadFileToCloudinary,
  multerMiddleware,
};
