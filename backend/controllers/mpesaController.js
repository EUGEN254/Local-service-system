import axios from "axios";
import { generateAuthToken } from "../middleware/mpesaAuth.js";
import mpesaTransactionsSchema from "../models/mpesaTransactionsSchema.js";
import Booking from "../models/bookingSchema.js";
import dotenv from 'dotenv';
import { getTimeStamp } from "../utils/mpesaTimestamp.js";
dotenv.config();


// 1️⃣ INITIATE STK PUSH
export const handleMpesa = async (req, res) => {
  try {
    const { amount, phone, serviceId, serviceName, bookingId } = req.body;
    
    // STK push initiated (sensitive details removed from logs in production)

    const token = await generateAuthToken();
    if(!token) {
      throw new Error("Failed to generate M-Pesa auth token");
    }
    
    const timestamp = getTimeStamp();
    
    // Normalize phone number into 2547XXXXXXXX format
    let raw = String(phone || "").trim();
    raw = raw.replace(/\s+/g, ""); // remove spaces
    if (raw.startsWith("+")) raw = raw.slice(1);

    let formattedPhoneNormalized = raw;
    if (formattedPhoneNormalized.startsWith("0")) {
      formattedPhoneNormalized = `254${formattedPhoneNormalized.slice(1)}`;
    } else if (/^7\d{8}$/.test(formattedPhoneNormalized)) {
      // e.g. 7XXXXXXXX -> prefix with 254
      formattedPhoneNormalized = `254${formattedPhoneNormalized}`;
    } else if (!formattedPhoneNormalized.startsWith("254")) {
      // If it's not already in the 254 format, assume national and prefix
      formattedPhoneNormalized = `254${formattedPhoneNormalized}`;
    }

    const password = Buffer.from(
      `${process.env.MPESA_SHORTCODE}${process.env.MPESA_PASSKEY}${timestamp}`
    ).toString("base64");

    const stkPushPayload = {
      BusinessShortCode: process.env.MPESA_SHORTCODE,
      Password: password,
      Timestamp: timestamp,
      TransactionType: "CustomerPayBillOnline",
      Amount: amount,
      PartyA: formattedPhoneNormalized,
      PartyB: process.env.MPESA_SHORTCODE,
      PhoneNumber: formattedPhoneNormalized,
      CallBackURL: process.env.MPESA_CALLBACK_URL,
      AccountReference: "LOCAL-SERVICE-SYSTEM",
      TransactionDesc: `Payment for ${serviceName}`,
    };

    // DEBUG: don't log secrets (token) in production
    const response = await axios.post(
      `${process.env.MPESA_BASE_URL}/mpesa/stkpush/v1/processrequest`,
      stkPushPayload,
      {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      }
    );

    // STK push response received

    // Save transaction
    const transaction = new mpesaTransactionsSchema({
      customer: req.customerName,
      bookingId,
      serviceId,
      serviceName,
      amount,
      phone: formattedPhoneNormalized, 
      transactionId: response.data.CheckoutRequestID,
      status: "pending",
    });

    await transaction.save();
    
    res.status(200).json({
      success: true,
      message: "M-Pesa payment initiated successfully.",
      data: response.data,
      debug: {
        phoneSent: formattedPhoneNormalized,
        amount: amount
      }
    });
    
  } catch (error) {
    console.error("❌ STK Push Full Error:", {
      message: error.message,
      response: error.response?.data,
      status: error.response?.status
    });
    res.status(500).json({
      success: false,
      message: "Failed to initiate M-Pesa payment",
      error: error.response?.data || error.message,
    });
  }
};

// 2️⃣ CALLBACK FROM M-PESA
export const handleCallback = async (req, res) => {
  try {
    // Callback received from M-Pesa

    const callbackData = req.body;
    const stkCallback = callbackData?.Body?.stkCallback;
    if (!stkCallback) return res.status(400).send("Invalid callback payload");

    const transactionId = stkCallback.CheckoutRequestID;
    const resultCode = stkCallback.ResultCode;
    const resultDesc = stkCallback.ResultDesc;

    const transaction = await mpesaTransactionsSchema.findOne({ transactionId });
    if (!transaction) return res.status(404).send("Transaction not found");

    if (transaction.status === "completed")
      return res.status(200).send("Already processed");

    let failureReason = "";
    let userMessage = "";

    switch (resultCode) {
      case 0:
        // ✅ Payment success
        transaction.status = "completed";
        transaction.mpesaReceiptNumber = stkCallback.CallbackMetadata?.Item?.find(
          (i) => i.Name === "MpesaReceiptNumber"
        )?.Value;
        transaction.callbackData = stkCallback;

        // ✅ Mark booking as paid
        if (transaction.bookingId) {
          await Booking.updateOne(
            { _id: transaction.bookingId },
            {
              $set: {
                is_paid: true,
                paymentMethod: "Mpesa",
                status: "Waiting for Work",
              },
            }
          );
        }
        userMessage = "Payment completed successfully.";
        break;

      default:
        // ❌ Payment failed or canceled
        transaction.status = "failed";
        transaction.failureReason = resultDesc;
        transaction.callbackData = stkCallback;

        // 🔥 NEW: mark booking as failed
        if (transaction.bookingId) {
          await Booking.updateOne(
            { _id: transaction.bookingId },
            {
              $set: {
                is_paid: false,
                status: "Payment Failed",
              },
            }
          );
        }

        userMessage = resultDesc || "Payment failed. Please try again.";
        failureReason = resultDesc;
        break;
    }

    await transaction.save();

    res.status(200).json({
      success: true,
      status: transaction.status,
      message: userMessage,
      failureReason,
    });
  } catch (err) {
    console.error("❌ M-Pesa Callback Error:", err.message);
    res.status(500).send("Server Error");
  }
};

// 3️⃣ CHECK PAYMENT STATUS
export const getPaymentStatus = async (req, res) => {
  try {
    const { transactionId } = req.params;
    // Checking payment status for transaction

    const tx = await mpesaTransactionsSchema.findOne({ transactionId });
    if (!tx) {
      return res.status(404).json({ success: false, message: "Transaction not found" });
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
