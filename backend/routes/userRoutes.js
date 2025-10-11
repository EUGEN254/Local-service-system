import express from "express";
import userAuth from "../middleware/userAuth.js";
import {
  getMe,
  loginUser,
  logoutUser,
  registerUser,
  updatePassword,
} from "../controllers/userContollers.js";

const userRouter = express.Router();

userRouter.post("/register", registerUser);
userRouter.post("/login", loginUser);
userRouter.post("/logout", logoutUser);
userRouter.get("/me", userAuth, getMe);
userRouter.put("/update-password", userAuth, updatePassword);



export default userRouter;
