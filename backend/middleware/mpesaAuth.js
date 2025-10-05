import axios from "axios";
import dotenv from "dotenv";
dotenv.config();

const CONSUMER_KEY = process.env.CONSUMER_KEY;
const CONSUMER_SECRET = process.env.CONSUMER_SECRET;
const MPESA_AUTH_URL = process.env.MPESA_AUTH_URL;

export const generateAuthToken = async () => {
  try {
    // Base64 encode consumer key and secret
    const auth = Buffer.from(`${CONSUMER_KEY}:${CONSUMER_SECRET}`).toString(
      "base64"
    );

    // Request OAuth token from Safaricom
    const response = await axios.get(MPESA_AUTH_URL, {
      headers: {
        Authorization: `Basic ${auth}`,
      },
    });

    return response.data.access_token; // return the token
  } catch (error) {
    console.error("M-Pesa Auth Error:", error.response?.data || error.message);
    throw error;
  }
};
