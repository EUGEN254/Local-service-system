// routes/categoryRoutes.js
import express from "express";
import userAuth from "../middleware/userAuth.js";
import adminAuth from "../middleware/adminAuth.js";
import upload from "../middleware/uploadMiddleware.js";
import {
  getCategories,
  createCategory,
  updateCategory,
  deleteCategory,
  toggleCategoryStatus
} from "../controllers/categoryControllers.js";

const categoryRouter = express.Router();

categoryRouter.get("/", getCategories);
categoryRouter.post("/", userAuth, adminAuth, upload.single("image"), createCategory);
categoryRouter.put("/:id", userAuth, adminAuth, upload.single("image"), updateCategory);
categoryRouter.delete("/:id", userAuth, adminAuth, deleteCategory);
categoryRouter.patch("/:id/toggle-status", userAuth, adminAuth, toggleCategoryStatus);

export default categoryRouter;