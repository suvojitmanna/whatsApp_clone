const multer = require("multer");
const cloudinary = require("cloudinary").v2;
require("dotenv").config();
const fs = require("fs");

// Cloudinary config
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

// Upload function
const uploadFileToCloudinary = (file) => {
  //prevent crash if no file
  if (!file) {
    return Promise.reject(new Error("No file uploaded"));
  }

  const isVideo = file.mimetype.startsWith("video");

  const options = {
    resource_type: isVideo ? "video" : "image",
  };

  return new Promise((resolve, reject) => {
    const uploader = isVideo
      ? cloudinary.uploader.upload_large
      : cloudinary.uploader.upload;

    uploader(file.path, options, (error, result) => {
      //delete local file safely
      if (file.path) {
        fs.unlink(file.path, (err) => {
          if (err) console.error("File delete error:", err);
        });
      }

      //proper error handling
      if (error) {
        console.error("Cloudinary upload error:", error);
        return reject(error);
      }

      resolve(result);
    });
  });
};

// Multer middleware
const multerMiddleware = multer({
  dest: "uploads/",
}).single("media");

module.exports = {
  uploadFileToCloudinary,
  multerMiddleware,
};
