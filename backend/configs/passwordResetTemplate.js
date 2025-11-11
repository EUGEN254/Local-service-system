export const PASSWORD_RESET_TEMPLATE = (otp, email) => `
<!DOCTYPE html>
<html>
<head>
  <style>
    body {
      font-family: 'Segoe UI', sans-serif;
      background-color: #f4f7fb;
      padding: 20px;
    }
    .container {
      background: #ffffff;
      padding: 25px;
      border-radius: 10px;
      max-width: 500px;
      margin: auto;
      box-shadow: 0 4px 8px rgba(0,0,0,0.1);
    }
    h2 {
      color: #333;
    }
    .otp-box {
      background: #007bff;
      color: #fff;
      font-size: 24px;
      letter-spacing: 5px;
      padding: 15px;
      text-align: center;
      border-radius: 8px;
      margin: 20px 0;
    }
    p {
      color: #444;
    }
    small {
      color: #888;
    }
  </style>
</head>
<body>
  <div class="container">
    <h2>Password Reset Request</h2>
    <p>Hi ${email},</p>
    <p>Use the OTP below to reset your password. It’s valid for <strong>15 minutes</strong>.</p>
    <div class="otp-box">${otp}</div>
    <p>If you didn’t request this, please ignore this email.</p>
    <small>— Local Service System</small>
  </div>
</body>
</html>
`;
