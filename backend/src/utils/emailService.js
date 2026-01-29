// Email service utilities
import axios from 'axios';
import { PASSWORD_RESET_TEMPLATE } from '../config/passwordResetTemplate.js';

export const sendOtpEmail = async (email, otp) => {
  try {
    const response = await axios.post(
      'https://api.brevo.com/v3/smtp/email',
      {
        sender: {
          name: process.env.SENDER_NAME,
          email: process.env.SENDER_EMAIL
        },
        to: [{ email: email }],
        subject: 'Password Reset OTP',
        htmlContent: PASSWORD_RESET_TEMPLATE(otp, email)
      },
      {
        headers: {
          'api-key': process.env.BREVO_API_KEY,
          'Content-Type': 'application/json'
        }
      }
    );

    return { success: true, messageId: response.data.messageId };
  } catch (error) {
    console.error('Email service error:', error.response?.data || error.message);
    throw new Error('Failed to send OTP. Please try again.');
  }
};

export const sendNotificationEmail = async (email, subject, htmlContent) => {
  try {
    const response = await axios.post(
      'https://api.brevo.com/v3/smtp/email',
      {
        sender: {
          name: process.env.SENDER_NAME,
          email: process.env.SENDER_EMAIL
        },
        to: [{ email: email }],
        subject: subject,
        htmlContent: htmlContent
      },
      {
        headers: {
          'api-key': process.env.BREVO_API_KEY,
          'Content-Type': 'application/json'
        }
      }
    );

    return { success: true, messageId: response.data.messageId };
  } catch (error) {
    console.error('Email service error:', error.response?.data || error.message);
    throw new Error('Failed to send email. Please try again.');
  }
};
