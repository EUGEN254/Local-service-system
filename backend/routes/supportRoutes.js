// routes/supportRoutes.js
import express from "express";
import {
  submitSupportTicket,
  getUserTickets,
  getAllTickets,
  updateTicketStatus,
  addTicketResponse
} from "../controllers/supportController.js";
import userAuth from "../middleware/userAuth.js";
import adminAuth from "../middleware/adminAuth.js";

const supportRouter = express.Router();

// User routes
supportRouter.post("/submit", userAuth, submitSupportTicket);
supportRouter.get("/my-tickets", userAuth, getUserTickets);

// Admin routes
supportRouter.get("/all", userAuth, adminAuth, getAllTickets);
supportRouter.put("/:ticketId/status", userAuth, adminAuth, updateTicketStatus);
supportRouter.post("/:ticketId/respond", userAuth, adminAuth, addTicketResponse);

export default supportRouter;