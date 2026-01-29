// controllers/supportController.js
import SupportTicket from "../models/supportTicketSchema.js";
import User from "../models/userSchema.js";
import { createNotification } from "./notificationController.js";

// Submit a new support ticket
export const submitSupportTicket = async (req, res) => {
  try {
    const { category, subject, message } = req.body;
    const userId = req.user._id;

    if (!subject || !message) {
      return res.status(400).json({
        success: false,
        message: "Subject and message are required"
      });
    }

    // Validate category or set default
    const validCategories = ["general", "technical", "account", "payment", "service", "other"];
    const ticketCategory = validCategories.includes(category) ? category : "general";

    // Create support ticket
    const ticket = await SupportTicket.create({
      user: userId,
      category: ticketCategory,
      subject,
      message,
      priority: getPriorityFromCategory(ticketCategory)
    });

    // ✅ Create notification for the USER
    await createNotification(userId, {
      title: "Support Ticket Submitted ✅",
      message: `Your support ticket "${subject}" has been received. We'll respond within 2 hours.`,
      type: "system",
      category: "System",
      priority: "medium"
    });

    // ✅ Create notification for ALL ADMINS
    const adminUsers = await User.find({ role: "admin" });
    for (const admin of adminUsers) {
      await createNotification(admin._id, {
        title: "New Support Ticket 🆘",
        message: `New ${ticketCategory} support ticket from ${req.user.name}: "${subject}"`,
        type: "system",
        category: "System",
        priority: "high",
        actionUrl: `/admin/support/tickets/${ticket._id}`
      });
    }

    res.status(201).json({
      success: true,
      message: "Support ticket submitted successfully! We'll respond within 2 hours.",
      ticket: {
        id: ticket._id,
        category: ticket.category,
        subject: ticket.subject,
        status: ticket.status,
        createdAt: ticket.createdAt
      }
    });

  } catch (error) {
    console.error("Error submitting support ticket:", error);
    
    // ✅ Create error notification for user
    await createNotification(req.user._id, {
      title: "Support Ticket Failed",
      message: "There was an error submitting your support ticket. Please try again.",
      type: "system",
      category: "System",
      priority: "high"
    });

    res.status(500).json({
      success: false,
      message: "Server error while submitting support ticket"
    });
  }
};

// Get user's support tickets
export const getUserTickets = async (req, res) => {
  try {
    const userId = req.user._id;
    const { status, page = 1, limit = 10 } = req.query;

    const filter = { user: userId };
    if (status && status !== 'all') {
      filter.status = status;
    }

    const tickets = await SupportTicket.find(filter)
      .sort({ createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit)
      .populate("assignedTo", "name email")
      .populate("responses.user", "name role");

    const total = await SupportTicket.countDocuments(filter);

    res.status(200).json({
      success: true,
      tickets,
      totalPages: Math.ceil(total / limit),
      currentPage: page,
      total
    });

  } catch (error) {
    console.error("Error fetching support tickets:", error);
    res.status(500).json({
      success: false,
      message: "Server error while fetching support tickets"
    });
  }
};

// Admin: Get all support tickets
export const getAllTickets = async (req, res) => {
  try {
    const { status, category, page = 1, limit = 20 } = req.query;

    const filter = {};
    if (status && status !== 'all') filter.status = status;
    if (category && category !== 'all') filter.category = category;

    const tickets = await SupportTicket.find(filter)
      .sort({ createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit)
      .populate("user", "name email phone role")
      .populate("assignedTo", "name email")
      .populate("responses.user", "name role");

    const total = await SupportTicket.countDocuments(filter);

    res.status(200).json({
      success: true,
      tickets,
      totalPages: Math.ceil(total / limit),
      currentPage: page,
      total
    });

  } catch (error) {
    console.error("Error fetching all support tickets:", error);
    res.status(500).json({
      success: false,
      message: "Server error while fetching support tickets"
    });
  }
};

// Admin: Update ticket status
export const updateTicketStatus = async (req, res) => {
  try {
    const { ticketId } = req.params;
    const { status, resolutionNotes } = req.body;

    const ticket = await SupportTicket.findById(ticketId).populate("user", "name email");
    if (!ticket) {
      return res.status(404).json({
        success: false,
        message: "Support ticket not found"
      });
    }

    const oldStatus = ticket.status;
    ticket.status = status;
    
    if (status === "resolved" || status === "closed") {
      ticket.resolvedAt = new Date();
      ticket.resolutionNotes = resolutionNotes;
    }

    await ticket.save();

    // ✅ Create notification for the USER about status update
    await createNotification(ticket.user._id, {
      title: `Support Ticket ${status === 'resolved' ? 'Resolved ✅' : 'Updated'}`,
      message: `Your support ticket "${ticket.subject}" has been ${status}. ${resolutionNotes ? `Notes: ${resolutionNotes}` : ''}`,
      type: "system",
      category: "System",
      priority: "medium"
    });

    res.status(200).json({
      success: true,
      message: `Ticket status updated to ${status}`,
      ticket
    });

  } catch (error) {
    console.error("Error updating ticket status:", error);
    res.status(500).json({
      success: false,
      message: "Server error while updating ticket status"
    });
  }
};

// Admin: Add response to ticket
export const addTicketResponse = async (req, res) => {
  try {
    const { ticketId } = req.params;
    const { message } = req.body;

    const ticket = await SupportTicket.findById(ticketId).populate("user", "name email");
    if (!ticket) {
      return res.status(404).json({
        success: false,
        message: "Support ticket not found"
      });
    }

    ticket.responses.push({
      user: req.user._id,
      message
    });

    // Update status if it was open
    if (ticket.status === "open") {
      ticket.status = "in-progress";
    }

    await ticket.save();

    // ✅ Create notification for the USER about new response
    await createNotification(ticket.user._id, {
      title: "New Response on Your Support Ticket",
      message: `Admin responded to your ticket "${ticket.subject}": ${message.substring(0, 100)}...`,
      type: "system",
      category: "System",
      priority: "medium"
    });

    res.status(200).json({
      success: true,
      message: "Response added successfully",
      ticket
    });

  } catch (error) {
    console.error("Error adding ticket response:", error);
    res.status(500).json({
      success: false,
      message: "Server error while adding response"
    });
  }
};

// Helper function to determine priority based on category
const getPriorityFromCategory = (category) => {
  switch (category) {
    case "payment":
      return "high";
    case "account":
      return "high";
    case "technical":
      return "medium";
    case "service":
      return "medium";
    default:
      return "low";
  }
};