import express from "express";
import * as authController from "../controllers/authController.js";
import authMiddleware from "../middleware/authMiddleware.js";
import { multerMiddleware } from "../config/cloudinary.js";

const router = express.Router();

router.post("/send-otp", authController.sendOtp);
router.post("/verify-otp", authController.verifyOtp);
router.put("/update-profile", authMiddleware, multerMiddleware, authController.updateProfile,);
router.get("/logout", authController.logout);
router.get('/check-auth', authMiddleware, authController.checkAuthenticated);
router.get("/users", authMiddleware, authController.getAllUsers);
router.put("/update-public-key", authMiddleware, authController.updatePublicKey);
router.get("/public-key/:userId", authMiddleware, authController.getUserPublicKey);

export default router;
