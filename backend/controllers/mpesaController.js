import axios from "axios";
import { generateAuthToken } from "../middleware/mpesaAuth.js";
import mpesaTransactionsSchema from "../models/mpesaTransactionsSchema.js";
import Booking from "../models/bookingSchema.js";
import dotenv from "dotenv";
import { getTimeStamp } from "../utils/mpesaTimestamp.js";
dotenv.config();

//INITIATE STK PUSH
export const handleMpesa = async (req, res) => {
  try {
    const { amount, phone, serviceId, serviceName, bookingId } = req.body;

    console.log("Initiating M-Pesa STK Push:", {
      amount,
      phone,
      serviceId,
      serviceName,
      bookingId,
    });

  
  const updatedServiceName = serviceName
  .replace(/&/g, 'and')
  .substring(0, 13)   
  .trim(); 


  console.log("Updated Service Name for TransactionDesc:", updatedServiceName);
    // Validate required fields
    if (!amount || !phone || !serviceId || !bookingId) {
      return res.status(400).json({
        success: false,
        message: "Missing required fields",
      });
    }

    // STK push initiated (sensitive details removed from logs in production)
    const token = await generateAuthToken();
    if (!token) {
      throw new Error("Failed to generate M-Pesa auth token");
    }

    const timestamp = getTimeStamp();

   
    let formattedPhone = phone.startsWith("0")
      ? `254${phone.slice(1)}`
      : phone.startsWith("+254")
        ? phone.slice(1)
        : phone;

 
    if (!formattedPhone.startsWith("254") && formattedPhone.length === 9) {
      formattedPhone = `254${formattedPhone}`;
    }


    if (!/^254\d{9}$/.test(formattedPhone)) {
      return res.status(400).json({
        success: false,
        message: "Invalid Kenyan phone number format. Use format: 07XXXXXXXX or 2547XXXXXXXX 0r 01XXXXXXXX",
      });
    }

    console.log("Formatted Phone Number:", formattedPhone);

    const password = Buffer.from(
      `${process.env.MPESA_SHORTCODE}${process.env.MPESA_PASSKEY}${timestamp}`,
    ).toString("base64");

    const stkPushPayload = {
      BusinessShortCode: process.env.MPESA_SHORTCODE,
      Password: password,
      Timestamp: timestamp,
      TransactionType: "CustomerPayBillOnline",
      Amount: amount,
      PartyA: formattedPhone,
      PartyB: process.env.MPESA_SHORTCODE,
      PhoneNumber: formattedPhone, 
      CallBackURL: process.env.MPESA_CALLBACK_URL,
      AccountReference: "LOCAL-SERVICE-SYSTEM",
      TransactionDesc: `Payment for ${updatedServiceName}`,
    };

    console.log("STK Push Payload:", {
      ...stkPushPayload,
      Password: "***", 
    });

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

    // Save transaction
    const transaction = new mpesaTransactionsSchema({
      customer: req.customerName,
      bookingId,
      serviceId,
      serviceName,
      amount,
      phone: formattedPhone,
      transactionId: response.data.CheckoutRequestID,
      status: "pending",
    });

    await transaction.save();

    res.status(200).json({
      success: true,
      message: "M-Pesa payment initiated successfully.",
      data: response.data,
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
    // Log the incoming callback
    console.log("STK Callback response:", JSON.stringify(req.body));

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

    console.log(`Processing callback for: ${checkoutRequestID}`);

    const transaction = await mpesaTransactionsSchema.findOne({
      transactionId: checkoutRequestID, 
    });

    if (!transaction) {
      console.error(`Transaction not found: ${checkoutRequestID}`);
      return;
    }

    // Check if already processed
    if (transaction.status === "completed" || transaction.callbackProcessed) {
      console.log(`Callback already processed: ${checkoutRequestID}`);
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

      console.log(
        `Payment successful: ${checkoutRequestID}, Receipt: ${mpesaReceiptNumber}`,
      );

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
        console.log(`Booking ${transaction.bookingId} marked as paid`);
      }
    } else {
      // Payment Failed
      transaction.status = "failed";
      transaction.failureReason = resultDesc;
      transaction.callbackProcessed = true;

      console.log(
        `Payment failed: ${checkoutRequestID}, Reason: ${resultDesc}`,
      );

      // Update booking status
      if (transaction.bookingId) {
        await Booking.findByIdAndUpdate(transaction.bookingId, {
          is_paid: false,
          paymentStatus: "failed",
          status: "Payment Failed",
          failureReason: resultDesc,
        });
        console.log(`Booking ${transaction.bookingId} marked as failed`);
      }
    }

    // Save callback data for reference
    transaction.callbackData = stkCallback;
    await transaction.save();

    console.log(`Callback processed successfully: ${checkoutRequestID}`);
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
