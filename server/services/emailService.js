const nodemailer = require("nodemailer");
const dotenv = require("dotenv");
dotenv.config();

const transport = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

transport.verify((error, success) => {
  if (error) {
    console.error("❌ Gmail connection failed:", error.message);
  } else {
    console.log("✅ Gmail configured and ready");
  }
});

const sendOtpToEmail = async (email, otp) => {
  const html = `
    <div style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; color: #333; line-height: 1.6; max-width: 600px; margin: 0 auto; border: 1px solid #eee; padding: 20px; border-radius: 10px;">
      <h2 style="color: #075e54; border-bottom: 2px solid #25d366; padding-bottom: 10px;">🔐 WhatsApp Web Verification</h2>
      
      <p>Hi there,</p>
      
      <p>Your one-time password (OTP) to verify your WhatsApp Web account is:</p>
      
      <div style="text-align: center; margin: 30px 0;">
        <span style="background: #e0f7fa; color: #004d40; padding: 15px 30px; font-size: 24px; font-weight: bold; border-radius: 8px; letter-spacing: 5px; border: 1px dashed #00bcd4;">
          ${otp}
        </span>
      </div>

      <p><strong>This OTP is valid for the next 5 minutes.</strong> For your security, please do not share this code with anyone.</p>

      <p style="background: #fff3e0; padding: 10px; border-left: 4px solid #ff9800; font-size: 0.9em;">
        If you didn’t request this OTP, someone may be trying to access your account. Please ignore this email or update your security settings.
      </p>

      <p style="margin-top: 30px;">Thanks & Regards,<br/><strong>WhatsApp Web Security Team</strong></p>

      <hr style="border: 0; border-top: 1px solid #eee; margin: 30px 0;" />

      <p style="font-size: 12px; color: #999; text-align: center;">
        This is an automated message. Please do not reply to this email.<br/>
        &copy; ${new Date().getFullYear()} WhatsApp LLC
      </p>
    </div>
  `;

  await transport.sendMail({
    from: `WhatsApp Web <${process.env.EMAIL_USER}>`,
    to: email,
    subject: `Your WhatsApp verification code`,
    html,
  });
};

module.exports = sendOtpToEmail;
