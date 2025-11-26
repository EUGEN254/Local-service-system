import express from "express";
import userAuth from "../middleware/userAuth.js";
import {
  getMe,
  loginUser,
  logoutUser,
  registerUser,
  updatePassword,
  submitIdVerification,
  getIdVerificationStatus, 
  loginAdmin,
  logoutAdmin,
  sendResetOtp,
  verifyResetOtp,
  resetPassword
} from "../controllers/userControllers.js";
import upload from "../middleware/uploadMiddleware.js";

const userRouter = express.Router();

userRouter.post("/register", registerUser);
userRouter.post("/login", loginUser);
userRouter.post("/login-admin", loginAdmin);
userRouter.post("/logoutAdmin", logoutAdmin);
userRouter.post("/logout", logoutUser);
userRouter.get("/me", userAuth, getMe);
userRouter.put("/update-password", userAuth, updatePassword);


// Password routes
userRouter.post("/send-reset-otp", sendResetOtp);
userRouter.post("/verify-reset-otp", verifyResetOtp);
userRouter.post("/reset-password", resetPassword);

// New ID Verification Routes
userRouter.post("/submit-id-verification", userAuth, upload.fields([
    { name: 'frontImage', maxCount: 1 },
    { name: 'backImage', maxCount: 1 }
  ]), 
  submitIdVerification
);

userRouter.get("/id-verification-status", userAuth, getIdVerificationStatus);

export default userRouter;