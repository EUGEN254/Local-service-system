import axios from "axios";
import { generateAuthToken } from "../middleware/mpesaAuth.js";
import mpesaTransactionsSchema from "../models/mpesaTransactionsSchema.js";

export const handleMpesa = async (req, res) => {
  try {
    const { amount, phone, serviceId, serviceName } = req.body;

    // Generate M-Pesa OAuth token
    const token = await generateAuthToken();

    // Create timestamp and password for STK Push
    const timestamp = new Date()
      .toISOString()
      .replace(/[^0-9]/g, "")
      .slice(0, 14);
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

    res
      .status(200)
      .json({
        success: true,
        message: "M-Pesa payment initiated",
        data: response.data,
      });
  } catch (error) {
    console.error("STK Push Error:", error.response?.data || error.message);
    res.status(500).json({
      success: false,
      message: "Failed to initiate M-Pesa payment",
      error: error.response?.data || error.message,
    });
  }
};



export const handleCallback = async (req, res) => {
    try {
      const callbackData = req.body;
  
      console.log("📥 M-Pesa Callback Received:", JSON.stringify(callbackData, null, 2));
  
      const { Body } = callbackData;
      const stkCallback = Body?.stkCallback;
      if (!stkCallback) return res.status(400).send("Invalid callback payload");
  
      const transactionId = stkCallback.CheckoutRequestID;
      const resultCode = stkCallback.ResultCode;
  
      const transaction = await mpesaTransactionsSchema.findOne({ transactionId });
      if (!transaction) {
        console.warn("Transaction not found for ID:", transactionId);
        return res.status(404).send("Transaction not found");
      }
  
      if (resultCode === 0) {
        transaction.status = "completed";
        transaction.mpesaReceiptNumber = stkCallback.CallbackMetadata?.Item?.find(
          (i) => i.Name === "MpesaReceiptNumber"
        )?.Value;
      } else {
        transaction.status = "failed";
      }
  
      await transaction.save();
  
      res.status(200).send("Callback processed successfully");
    } catch (err) {
      console.error("M-Pesa Callback Error:", err.message);
      res.status(500).send("Server Error");
    }
  };
  

  export const getPaymentStatus = async (req, res) => {
    try {
      const { transactionId } = req.params;
      const tx = await mpesaTransactionsSchema.findOne({ transactionId });
  
      if (!tx) {
        return res.status(404).json({ success: false, message: "Transaction not found" });
      }
  
      res.json({ success: true, status: tx.status });
    } catch (error) {
      res.status(500).json({ success: false, message: error.message });
    }
  };
  