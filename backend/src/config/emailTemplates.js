export const VERIFICATION_EMAIL_TEMPLATE = (verificationToken, name) => {
  const verificationLink = `${process.env.CLIENT_URL}/verify-email/${verificationToken}`;

  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
    </head>
    <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
      <div style="background-color: #f8f9fa; border-radius: 10px; padding: 30px; text-align: center;">
        <h1 style="color: #000000; margin-bottom: 20px;">Verify Your Email Address</h1>
        <p style="font-size: 16px; margin-bottom: 20px;">Hello ${name},</p>
        <p style="font-size: 16px; margin-bottom: 30px;">
          Thank you for registering! Please verify your email address by clicking the button below:
        </p>
        <a href="${verificationLink}" 
           style="display: inline-block; background-color: #4F46E5; color: white; 
                  padding: 12px 30px; text-decoration: none; border-radius: 5px; 
                  font-size: 16px; font-weight: bold; margin-bottom: 30px;">
          Verify Email Address
        </a>
        <hr style="border: none; border-top: 1px solid #e0e0e0; margin: 30px 0;">
        <p style="font-size: 12px; color: #999;">
          This link will expire in 24 hours. If you didn't create an account, you can ignore this email.
        </p>
      </div>
    </body>
    </html>
  `;
};

// Redirect based on role
export const REDIRECT_PATHS = (role) => {
  let redirectPath = "";
  if (role === "customer") {
    redirectPath = "/user/dashboard";
  } else if (role === "service-provider") {
    redirectPath = "/sp";
  }
  return redirectPath;
};



export const WELCOME_EMAIL_TEMPLATE = (email, name, role) => {
  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="UTF-8">
    </head>
    <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
      <div style="background-color: #f8f9fa; border-radius: 10px; padding: 30px; text-align: center;">
        <h1 style="color: #000000; margin-bottom: 20px;">Welcome to Our Platform! HOME MANTAINANCE SERVICES 🎉</h1>
        <p style="font-size: 16px; margin-bottom: 20px;">Hello ${name},</p>
        <p style="font-size: 16px; margin-bottom: 20px;">Your email ${email} has been successfully verified.</p>
        <p style="font-size: 16px; margin-bottom: 20px;">Your role ${role} has been assigned.</p>
        <p style="font-size: 16px; margin-bottom: 30px;">
          You can now access all features of our platform.
        </p>
        <a href="${process.env.CLIENT_URL}${REDIRECT_PATHS(role)}" 
           style="display: inline-block; background-color: #4F46E5; color: white; 
                  padding: 12px 30px; text-decoration: none; border-radius: 5px; 
                  font-size: 16px; font-weight: bold;">
          Go to Dashboard
        </a>
      </div>
    </body>
    </html>
  `;
};
