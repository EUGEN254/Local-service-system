import axios from "axios";
import { generateAuthToken } from "../middleware/mpesaAuth.js";
import mpesaTransactionsSchema from "../models/mpesaTransactionsSchema.js";
import Booking from "../models/bookingSchema.js";

// 1️⃣ INITIATE STK PUSH
export const handleMpesa = async (req, res) => {
  try {
    const { amount, phone, serviceId, serviceName, bookingId } = req.body;
   

    console.log("🟢 handleMpesa called with:", { amount, phone, serviceId, serviceName });

    const token = await generateAuthToken();
    const timestamp = new Date().toISOString().replace(/[^0-9]/g, "").slice(0, 14);
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
    const callbackData = req.body;
    console.log("📥 M-Pesa Callback Received:", JSON.stringify(callbackData, null, 2));

    const stkCallback = callbackData?.Body?.stkCallback;
    if (!stkCallback) {
      console.warn("⚠️ Invalid callback payload (missing stkCallback)");
      return res.status(400).send("Invalid callback payload");
    }

    const transactionId = stkCallback.CheckoutRequestID;
    const resultCode = stkCallback.ResultCode;
    const resultDesc = stkCallback.ResultDesc;

    console.log(`🔍 ResultCode: ${resultCode}, Description: ${resultDesc}`);
    const transaction = await mpesaTransactionsSchema.findOne({ transactionId });
    if (!transaction) {
      console.warn("⚠️ Transaction not found for ID:", transactionId);
      return res.status(404).send("Transaction not found");
    }

    // Prevent overwriting successful payments
    if (transaction.status === "completed") {
      console.log("✅ Transaction already marked completed — skipping update.");
      return res.status(200).send("Already processed");
    }

    let failureReason = "";
    let userMessage = "";

    switch (resultCode) {
      case 0:
        // ✅ Success
        transaction.status = "completed";
        transaction.mpesaReceiptNumber = stkCallback.CallbackMetadata?.Item?.find(
          (i) => i.Name === "MpesaReceiptNumber"
        )?.Value;
        transaction.callbackData = stkCallback;

        console.log("✅ Payment completed successfully from Safaricom");

        // Update booking
        if (transaction.bookingId) {
          await Booking.updateOne(
            { _id: transaction.bookingId },
            { $set: { is_paid: true, paymentMethod: "Mpesa" } }
          );
          console.log("🟢 Booking marked as paid.");
        }
        break;

      case 1037:
        failureReason = "No response from the user.";
        userMessage =
          "The payment prompt timed out. Please retry your payment.";
        break;

      case 1032:
        failureReason = "Request canceled by user.";
        userMessage =
          "You canceled the payment or it timed out. Please try again.";
        break;

      case 1:
        failureReason = "Insufficient balance.";
        userMessage =
          "Insufficient funds on M-PESA. Please top up or use Fuliza.";
        break;

      case 2001:
        failureReason = "Invalid initiator information.";
        userMessage = "Incorrect M-PESA PIN or credentials. Please retry.";
        break;

      case 1019:
        failureReason = "Transaction expired.";
        userMessage = "Transaction expired. Please initiate payment again.";
        break;

      case 1001:
        failureReason = "Duplicate session or subscriber locked.";
        userMessage =
          "You have another M-PESA session active. Please wait 2-3 minutes and try again.";
        break;

      default:
        failureReason = `Unknown error (code ${resultCode})`;
        userMessage = resultDesc || "Transaction failed. Please try again.";
        break;
    }

    if (resultCode !== 0) {
      console.warn(`⚠️ Payment failed (Code: ${resultCode}) — ${failureReason}`);
      transaction.status = "failed";
      transaction.failureReason = failureReason;
      transaction.callbackData = stkCallback;
    }

    await transaction.save();
    console.log(
      `💾 Transaction updated: ${transaction.transactionId} → ${transaction.status}`
    );

    res.status(200).json({
      success: true,
      message:
        resultCode === 0
          ? "Payment completed successfully."
          : `Payment failed: ${failureReason}`,
      userMessage,
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
