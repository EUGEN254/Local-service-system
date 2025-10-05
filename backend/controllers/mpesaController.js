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
