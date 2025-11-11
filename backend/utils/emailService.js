import axios from 'axios';
import { PASSWORD_RESET_TEMPLATE } from '../configs/passwordResetTemplate.js';



export async function sendOtpEmail(email, otp) {
  try {
    const response = await axios.post(
      'https://api.brevo.com/v3/smtp/email',
      {
        sender: {
          name: 'SafeCity',
          email: process.env.SENDER_EMAIL
        },
        to: [{ email: email }],
        subject: 'Password Reset OTP',
        htmlContent: PASSWORD_RESET_TEMPLATE(otp, email)
      },
      {
        headers: {
          'api-key': process.env.BREVO_API_KEY, // Use your v3 API key here
          'Content-Type': 'application/json'
        }
      }
    );

    return { success: true, messageId: response.data.messageId };
  } catch (error) {
    console.error('Brevo API error:', error.response?.data || error.message);
    throw new Error('Failed to send OTP. Please try again.');
  }
}