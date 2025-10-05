import axios from "axios";
import { generateAuthToken } from "../middleware/mpesaAuth.js";
import mpesaTransactionsSchema from "../models/mpesaTransactionsSchema.js";
import Booking from "../models/bookingSchema.js";

// 1️⃣ INITIATE STK PUSH
export const handleMpesa = async (req, res) => {
  try {
    const { amount, phone, serviceId, serviceName } = req.body;
    console.log("🟢 handleMpesa called with:", { amount, phone, serviceId, serviceName });

    // Generate M-Pesa OAuth token
    const token = await generateAuthToken();
    console.log("✅ OAuth token generated successfully");

    // Create timestamp and password for STK Push
    const timestamp = new Date().toISOString().replace(/[^0-9]/g, "").slice(0, 14);
    const password = Buffer.from(
      `${process.env.MPESA_SHORTCODE}${process.env.MPESA_PASSKEY}${timestamp}`
    ).toString("base64");

    // STK Push payload
    const stkPushPayload = {
      BusinessShortCode: process.env.MPESA_SHORTCODE,
      Password: password,
      Timestamp: timestamp,
      TransactionType: "CustomerPayBillOnline",
      Amount: amount,
      PartyA: phone,
      PartyB: process.env.MPESA_SHORTCODE,
      PhoneNumber: phone,
      CallBackURL: process.env.MPESA_CALLBACK_URL,
      AccountReference: serviceName,
      TransactionDesc: `Payment for ${serviceName}`,
    };

    console.log("📤 Sending STK Push request to Safaricom API...");

    // Send request to Safaricom STK Push endpoint
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

    // Save transaction to DB
    const transaction = new mpesaTransactionsSchema({
      customer: req.customerName,
      serviceId,
      serviceName,
      amount,
      phone,
      transactionId: response.data.CheckoutRequestID,
      status: "pending",
    });

    await transaction.save();
    console.log(`💾 Transaction saved with ID: ${transaction._id} and status: pending`);

    res.status(200).json({
      success: true,
      message: "M-Pesa payment initiated",
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
    const callbackData = req.body;
    console.log("📥 M-Pesa Callback Received:", JSON.stringify(callbackData, null, 2));

    const { Body } = callbackData;
    const stkCallback = Body?.stkCallback;
    if (!stkCallback) {
      console.warn("⚠️ Invalid callback payload (missing stkCallback)");
      return res.status(400).send("Invalid callback payload");
    }

    const transactionId = stkCallback.CheckoutRequestID;
    const resultCode = stkCallback.ResultCode;
    console.log(`🔍 Searching for transaction with ID: ${transactionId}`);

    const transaction = await mpesaTransactionsSchema.findOne({ transactionId });
    if (!transaction) {
      console.warn("⚠️ Transaction not found for ID:", transactionId);
      return res.status(404).send("Transaction not found");
    }

    console.log(`🧾 Transaction found: ${transaction._id} (status: ${transaction.status})`);

    if (resultCode === 0) {
      console.log("✅ Payment completed successfully from Safaricom");

      transaction.status = "completed";
      transaction.mpesaReceiptNumber = stkCallback.CallbackMetadata?.Item?.find(
        (i) => i.Name === "MpesaReceiptNumber"
      )?.Value;
      transaction.callbackData = stkCallback;

      // 🔹 Automatically mark booking as paid
      console.log("🔄 Updating booking as paid...");
      const bookingUpdate = await Booking.updateOne(
        { _id: transaction.serviceId },
        {
          $set: {
            is_paid: true,
            paymentMethod: "Mpesa",
          },
        }
      );
      console.log("🟢 Booking update result:", bookingUpdate);
    } else {
      console.warn(`⚠️ Payment failed or cancelled (ResultCode: ${resultCode})`);
      transaction.status = "failed";
      transaction.callbackData = stkCallback;
    }

    await transaction.save();
    console.log(`💾 Transaction updated: ${transaction.transactionId} → ${transaction.status}`);

    res.status(200).send("Callback processed successfully");
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
      console.warn("⚠️ Transaction not found for:", transactionId);
      return res.status(404).json({ success: false, message: "Transaction not found" });
    }

    console.log(`ℹ️ Transaction status: ${tx.status}`);

    res.json({ success: true, status: tx.status });
  } catch (error) {
    console.error("❌ getPaymentStatus Error:", error.message);
    res.status(500).json({ success: false, message: error.message });
  }
};
