import nodemailer from "nodemailer";

const smtpHost = process.env.SMTP_HOST || "smtp.gmail.com";
const smtpPort = parseInt(process.env.SMTP_PORT || "587");
const smtpUser = process.env.SMTP_USER;
const smtpPass = process.env.SMTP_PASS;
const smtpFrom = process.env.SMTP_FROM || "Next Notes <no-reply@glassnotes.com>";

export const transporter = nodemailer.createTransport({
  host: smtpHost,
  port: smtpPort,
  secure: smtpPort === 465, // Use secure transport for 465, starttls for 587
  auth: {
    user: smtpUser,
    pass: smtpPass,
  },
});

export async function sendVerificationCode(
  email: string, 
  code: string, 
  actionName: string = "Vault Password Reset",
  description: string = "You requested to reset your Next Notes Secret Vault master password."
) {
  const mailOptions = {
    from: smtpFrom,
    to: email,
    subject: `Next Notes - ${actionName} Code`,
    html: `
      <div style="background-color: #040209; color: #F4F2F7; padding: 40px; font-family: sans-serif; border-radius: 12px; max-width: 600px; margin: auto; border: 1px solid rgba(139, 92, 246, 0.2);">
        <h2 style="color: #8B5CF6; border-bottom: 1px solid rgba(255,255,255,0.1); padding-bottom: 10px;">${actionName}</h2>
        <p>${description} Use the verification code below to complete the process:</p>
        <div style="background: rgba(139, 92, 246, 0.1); border: 1px solid #8B5CF6; padding: 20px; text-align: center; border-radius: 8px; margin: 30px 0;">
          <span style="font-size: 32px; font-weight: bold; letter-spacing: 6px; color: #C084FC;">${code}</span>
        </div>
        <p style="color: #9CA3AF; font-size: 14px;"><strong>Note:</strong> This verification code is only valid for <strong>60 seconds</strong>. If you did not request this, you can safely ignore this email.</p>
        <div style="margin-top: 40px; border-top: 1px solid rgba(255,255,255,0.1); padding-top: 20px; font-size: 12px; color: #6B7280; text-align: center;">
          Next Notes App &bull; Secure Glassmorphism Workspace
        </div>
      </div>
    `,
  };

  try {
    const info = await transporter.sendMail(mailOptions);
    console.log("Email sent successfully:", info.messageId);
    return { success: true };
  } catch (error) {
    console.error("Nodemailer Error sending email:", error);
    // If SMTP details are empty/not configured, we log the code so development is not blocked!
    console.log(`[DEV MODE] ${actionName} Code for ${email} is: ${code}`);
    return {
      success: false,
      error: "Failed to send email. If in development, check CLI console output for the code.",
      devCode: process.env.NODE_ENV === "development" ? code : undefined
    };
  }
}
