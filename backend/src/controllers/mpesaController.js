import axios from "axios";
import { generateAuthToken } from "../middleware/index.js";
import mpesaTransactionsSchema from "../models/mpesaTransactionsSchema.js";
import Booking from "../models/bookingSchema.js";
import dotenv from "dotenv";
import { getMpesaTimestampOld as getTimeStamp } from "../utils/index.js";
dotenv.config();

//INITIATE STK PUSH
export const handleMpesa = async (req, res) => {
  try {
    const { amount, phone, serviceId, serviceName, bookingId } = req.body;

    // Validate required fields
    if (!amount || !phone || !serviceId || !bookingId) {
      return res.status(400).json({
        success: false,
        message:
          "Missing required fields: amount, phone, serviceId, and bookingId are required",
      });
    }

    // Validate phone is a number or string
    if (typeof phone !== "string" && typeof phone !== "number") {
      return res.status(400).json({
        success: false,
        message: "Phone number must be a string or number",
      });
    }

    // Process service name for TransactionDesc
    const updatedServiceName = serviceName
      ? serviceName.replace(/&/g, "and").substring(0, 13).trim()
      : "Service Payment";

    // STK push initiated
    const token = await generateAuthToken();
    if (!token) {
      throw new Error("Failed to generate M-Pesa auth token");
    }

    const timestamp = getTimeStamp();

    // Convert phone to string and clean it
    const phoneString = String(phone).trim();

    // Remove any non-digit characters except leading +
    let cleanPhone = phoneString.replace(/[^\d+]/g, "");

    // Handle different phone formats
    let formattedPhone = "";

    if (cleanPhone.startsWith("+")) {
      // Remove + and check if it's +254
      cleanPhone = cleanPhone.substring(1);
    }

    if (cleanPhone.startsWith("0")) {
      // 07XXXXXXXX or 01XXXXXXXX -> 2547XXXXXXXX or 2541XXXXXXXX
      formattedPhone = `254${cleanPhone.substring(1)}`;
    } else if (cleanPhone.startsWith("254")) {
      // Already in 254 format
      formattedPhone = cleanPhone;
    } else if (cleanPhone.length === 9) {
      // 7XXXXXXXX or 1XXXXXXXX -> 2547XXXXXXXX or 2541XXXXXXXX
      formattedPhone = `254${cleanPhone}`;
    } else {
      // Try to use as-is after validation
      formattedPhone = cleanPhone;
    }

    // Validate Kenyan phone number format
    if (!/^254[17]\d{8}$/.test(formattedPhone)) {
      return res.status(400).json({
        success: false,
        message:
          "Invalid Kenyan phone number format. Use format: 07XXXXXXXX, 2547XXXXXXXX, 01XXXXXXXX, or 2541XXXXXXXX",
        provided: phone,
        formatted: formattedPhone,
      });
    }

    // Generate password
    const password = Buffer.from(
      `${process.env.MPESA_SHORTCODE}${process.env.MPESA_PASSKEY}${timestamp}`,
    ).toString("base64");

    // Prepare STK push payload
    const stkPushPayload = {
      BusinessShortCode: process.env.MPESA_SHORTCODE,
      Password: password,
      Timestamp: timestamp,
      TransactionType: "CustomerPayBillOnline",
      Amount: Math.floor(amount), // Ensure amount is integer
      PartyA: formattedPhone,
      PartyB: process.env.MPESA_SHORTCODE,
      PhoneNumber: formattedPhone,
      CallBackURL: process.env.MPESA_CALLBACK_URL,
      AccountReference: "LOCAL-SERVICE-SYSTEM",
      TransactionDesc: `Payment for ${updatedServiceName}`,
    };

    // Make STK push request
    const response = await axios.post(
      `${process.env.MPESA_BASE_URL}/mpesa/stkpush/v1/processrequest`,
      stkPushPayload,
      {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        timeout: 30000,
      },
    );

    // Validate response
    if (!response.data || !response.data.CheckoutRequestID) {
      throw new Error("Invalid response from M-Pesa API");
    }

    // Save transaction to database
    const transaction = new mpesaTransactionsSchema({
      customer: req.customerName || "Anonymous",
      bookingId,
      serviceId,
      serviceName,
      amount,
      phone: formattedPhone,
      transactionId: response.data.CheckoutRequestID,
      merchantRequestID: response.data.MerchantRequestID || "",
      responseCode: response.data.ResponseCode || "",
      responseDescription: response.data.ResponseDescription || "",
      customerMessage: response.data.CustomerMessage || "",
      status: "pending",
      createdAt: new Date(),
    });

    await transaction.save();

    // Send success response
    res.status(200).json({
      success: true,
      message: "M-Pesa payment initiated successfully.",
      data: {
        checkoutRequestID: response.data.CheckoutRequestID,
        merchantRequestID: response.data.MerchantRequestID,
        customerMessage: response.data.CustomerMessage,
        amount,
        phone: formattedPhone,
        serviceName: updatedServiceName,
      },
    });
  } catch (error) {
    console.error("STK Push Full Error:", {
      message: error.message,
      response: error.response?.data,
      status: error.response?.status,
    });

    res.status(500).json({
      success: false,
      message: "Failed to initiate M-Pesa payment",
      error: error.response?.data || error.message,
    });
  }
};

// CALLBACK FROM M-PESA
export const handleCallback = async (req, res) => {
  try {
    const callbackData = req.body;
    const stkCallback = callbackData?.Body?.stkCallback;

    if (!stkCallback) {
      console.warn("Invalid callback payload:", callbackData);
      // Still send proper MPESA response
      return res.json({
        ResultCode: 1,
        ResultDesc: "Invalid callback payload",
      });
    }

    const checkoutRequestID = stkCallback.CheckoutRequestID;
    const resultCode = stkCallback.ResultCode;
    const resultDesc = stkCallback.ResultDesc;

    // Acknowledge immediately
    res.json({
      ResultCode: 0,
      ResultDesc: "Accepted",
    });

    // Now process asynchronously
    await processCallbackAsync(stkCallback);
  } catch (err) {
    console.error("M-Pesa Callback Error:", err.message);
    // If response hasn't been sent yet (shouldn't happen)
    if (!res.headersSent) {
      res.json({
        ResultCode: 0,
        ResultDesc: "Accepted", // Still accept to prevent retries
      });
    }
  }
};

// Async processing function
const processCallbackAsync = async (stkCallback) => {
  try {
    const checkoutRequestID = stkCallback.CheckoutRequestID;
    const resultCode = stkCallback.ResultCode;
    const resultDesc = stkCallback.ResultDesc;

    const transaction = await mpesaTransactionsSchema.findOne({
      transactionId: checkoutRequestID,
    });

    if (!transaction) {
      console.error(`Transaction not found: ${checkoutRequestID}`);
      return;
    }

    // Check if already processed
    if (transaction.status === "completed" || transaction.callbackProcessed) {
      return;
    }

    // Extract payment details
    const callbackMetadata = stkCallback.CallbackMetadata;
    let mpesaReceiptNumber = "";
    let amount = 0;
    let phoneNumber = "";

    if (callbackMetadata) {
      // Handle both array and object formats
      const items = callbackMetadata.Item || callbackMetadata;
      const itemsArray = Array.isArray(items) ? items : [items];

      itemsArray.forEach((item) => {
        if (item.Name === "MpesaReceiptNumber") mpesaReceiptNumber = item.Value;
        if (item.Name === "Amount") amount = Number(item.Value);
        if (item.Name === "PhoneNumber") phoneNumber = item.Value;
      });
    }

    if (resultCode === 0) {
      // Payment Success
      transaction.status = "completed";
      transaction.mpesaReceiptNumber = mpesaReceiptNumber;
      transaction.amountPaid = amount;
      transaction.payerPhone = phoneNumber;
      transaction.paidAt = new Date();
      transaction.callbackProcessed = true;
      transaction.failureReason = "";

      // Update booking status
      if (transaction.bookingId) {
        await Booking.findByIdAndUpdate(transaction.bookingId, {
          is_paid: true,
          paymentMethod: "Mpesa",
          paymentStatus: "paid",
          status: "Waiting for Work",
          mpesaReceiptNumber: mpesaReceiptNumber,
          paidAt: new Date(),
        });
      }
    } else {
      // Payment Failed
      transaction.status = "failed";
      transaction.failureReason = resultDesc;
      transaction.callbackProcessed = true;

      // Update booking status
      if (transaction.bookingId) {
        await Booking.findByIdAndUpdate(transaction.bookingId, {
          is_paid: false,
          paymentStatus: "failed",
          status: "Payment Failed",
          failureReason: resultDesc,
        });
      }
    }

    // Save callback data for reference
    transaction.callbackData = stkCallback;
    await transaction.save();
  } catch (error) {
    console.error(
      "Error in async callback processing:",
      error.message,
      error.stack,
    );
  }
};

// CHECK PAYMENT STATUS
export const getPaymentStatus = async (req, res) => {
  try {
    const { transactionId } = req.params;
    // Checking payment status for transaction

    const tx = await mpesaTransactionsSchema.findOne({ transactionId });
    if (!tx) {
      return res
        .status(404)
        .json({ success: false, message: "Transaction not found" });
    }

    res.json({
      success: true,
      status: tx.status,
      failureReason: tx.failureReason || null,
    });
  } catch (error) {
    console.error("❌ getPaymentStatus Error:", error.message);
    res.status(500).json({ success: false, message: error.message });
  }
};
