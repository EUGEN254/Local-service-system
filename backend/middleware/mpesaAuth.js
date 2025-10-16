import axios from "axios";
import dotenv from "dotenv";
dotenv.config();

const CONSUMER_KEY = process.env.CONSUMER_KEY;
const CONSUMER_SECRET = process.env.CONSUMER_SECRET;
const MPESA_AUTH_URL = process.env.MPESA_AUTH_URL;

export const generateAuthToken = async () => {
  try {
    const auth = Buffer.from(`${CONSUMER_KEY}:${CONSUMER_SECRET}`).toString("base64");
    const response = await axios.get(MPESA_AUTH_URL, {
      headers: { Authorization: `Basic ${auth}` },
    });

    return response.data.access_token;
  } catch (error) {
    console.error("❌ Auth Error:", error.response?.data || error.message);
    throw error;
  }
};

