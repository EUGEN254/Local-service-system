import { Resend } from 'resend';
import { PASSWORD_RESET_TEMPLATE } from '../configs/passwordResetTemplate.js';

const resend = new Resend(process.env.RESEND_API_KEY);



export async function sendOtpEmail(email, otp) {
  try {
    const { data, error } = await resend.emails.send({
      from: `safecity <onboarding@resend.dev>`,
      to: email,
      subject: 'Password Reset OTP',
      html: PASSWORD_RESET_TEMPLATE(otp, email) 
    });

    if (error) {
      console.error('Resend error:', error);
      throw new Error('Failed to send email');
    }

    console.log('OTP email sent successfully:', data.id);
    return { success: true, messageId: data.id };
    
  } catch (error) {
    console.error('Email service error:', error);
    throw new Error('Failed to send OTP. Please try again.');
  }
}