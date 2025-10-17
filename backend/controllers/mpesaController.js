import axios from "axios";
import { generateAuthToken } from "../middleware/mpesaAuth.js";
import mpesaTransactionsSchema from "../models/mpesaTransactionsSchema.js";
import Booking from "../models/bookingSchema.js";
import dotenv from 'dotenv';
dotenv.config();


// 1️⃣ INITIATE STK PUSH
export const handleMpesa = async (req, res) => {
  try {
    const { amount, phone, serviceId, serviceName, bookingId } = req.body;
   

    console.log("🟢 handleMpesa called with:", { amount, phone, serviceId, serviceName });

    const token = await generateAuthToken();
    const timestamp = new Date().toISOString().replace(/[^0-9]/g, '').slice(0, -3);
    const password = Buffer.from(
      `${process.env.MPESA_SHORTCODE}${process.env.MPESA_PASSKEY}${timestamp}`
    ).toString("base64");

    const stkPushPayload = {
      BusinessShortCode: process.env.MPESA_SHORTCODE,
      Password: password,
      Timestamp: timestamp,
      TransactionType: "CustomerPayBillOnline",
      Amount: amount,
      PartyA: `254${phone.slice(-9)}`,
      PartyB: process.env.MPESA_SHORTCODE,
      PhoneNumber: `254${phone.slice(-9)}`,
      CallBackURL: process.env.MPESA_CALLBACK_URL,
      AccountReference: serviceName,
      TransactionDesc: `Payment for ${serviceName}`,
    };

   

    console.log("📤 Sending STK Push request...");
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

    console.log("✅ STK Push Response:", JSON.stringify(response.data, null, 2));

    const transaction = new mpesaTransactionsSchema({
      customer: req.customerName,
      bookingId,
      serviceId,
      serviceName,
      amount,
      phone,
      transactionId: response.data.CheckoutRequestID,
      status: "pending",
    });

    await transaction.save();
    console.log(`💾 Transaction saved: ${transaction._id}`);

    res.status(200).json({
      success: true,
      message: "M-Pesa payment initiated successfully.",
      data: response.data,
    });
  } catch (error) {
    console.error("❌ STK Push Error:", error.response?.data || error.message);
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
    console.log("📥 Callback received:", JSON.stringify(req.body, null, 2));

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
    console.log(`🔍 Checking payment status for transaction: ${transactionId}`);

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
