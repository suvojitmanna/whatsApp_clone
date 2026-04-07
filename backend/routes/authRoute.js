const express = require("express");
const authController = require("../controllers/authController.js");
const authMiddleware = require("../middleware/authMiddleware.js");
const { multerMiddleware } = require("../config/cloudinary.js");

const router = express.Router();

router.post("/send-otp", authController.sendOtp);
router.post("/verify-otp", authController.verifyOtp);

router.put(
  "/update-profile",
  authMiddleware,
  multerMiddleware,
  authController.updateProfile,
);

router.get("/logout",authController.logout);

router.get('/check-auth', authMiddleware, authController.checkAuthenticated);

router.get("/users", authMiddleware, authController.getAllUsers);

module.exports = router;
