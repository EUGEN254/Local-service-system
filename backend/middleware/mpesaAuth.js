import axios from "axios";
import dotenv from "dotenv";
dotenv.config();

const CONSUMER_KEY='5PtpNCucOodm74LIFBOOdAP107ddtisGPLPd6mnnUbvvniYn'
const CONSUMER_SECRET='RQ9dGFeV9wRrA3CEwYcbYcHTd2mKGrSw8POszKUDEEY2zp28irES0p17ClevicWk'
const MPESA_AUTH_URL='https://sandbox.safaricom.co.ke/oauth/v1/generate?grant_type=client_credentials'

export const generateAuthToken = async () => {
  try {
    const auth = Buffer.from(`${CONSUMER_KEY}:${CONSUMER_SECRET}`).toString('base64');
    
    const response = await axios.get(MPESA_AUTH_URL, {
      headers: {
        Authorization: `Basic ${auth}`,
      },
    });

    return response.data.access_token;
  } catch (error) {
    console.error('Auth Error:', error);
    throw error;
  }
};