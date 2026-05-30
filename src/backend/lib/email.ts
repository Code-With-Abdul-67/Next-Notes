import nodemailer from "nodemailer";

export async function sendVaultResetEmail(toEmail: string, code: string) {
  // Create transporter fresh each call so env vars are always current
  const transporter = nodemailer.createTransport({
    host: "smtp.gmail.com",
    port: 465,
    secure: true, // SSL
    auth: {
      user: process.env.SMTP_EMAIL,
      pass: process.env.SMTP_PASSWORD,
    },
  });

  await transporter.sendMail({
    from: `"NEXT Notes" <${process.env.SMTP_EMAIL}>`,
    to: toEmail,
    subject: "Your Vault Reset Code — NEXT Notes",
    html: `
      <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; background: #040209; color: #F4F2F7; max-width: 480px; margin: 0 auto; padding: 40px 24px; border-radius: 16px;">
        <div style="text-align: center; margin-bottom: 32px;">
          <div style="display: inline-flex; align-items: center; justify-content: center; width: 56px; height: 56px; background: linear-gradient(135deg, #7C3AED, #4F46E5); border-radius: 14px; margin-bottom: 16px;">
            <span style="font-size: 24px;">🔐</span>
          </div>
          <h1 style="margin: 0; font-size: 22px; font-weight: 700; color: #F4F2F7;">Vault Reset Code</h1>
          <p style="margin: 8px 0 0; color: rgba(244,242,247,0.5); font-size: 14px;">NEXT Notes Secret Vault</p>
        </div>

        <p style="color: rgba(244,242,247,0.7); font-size: 14px; line-height: 1.6; margin-bottom: 24px;">
          You requested a reset of your vault master password. Enter the code below to continue. It expires in <strong style="color: #F4F2F7;">5 minutes</strong>.
        </p>

        <div style="background: rgba(139,92,246,0.12); border: 1px solid rgba(139,92,246,0.3); border-radius: 12px; padding: 24px; text-align: center; margin-bottom: 24px;">
          <p style="margin: 0 0 8px; font-size: 12px; color: rgba(244,242,247,0.4); letter-spacing: 2px; text-transform: uppercase;">Your Reset Code</p>
          <p style="margin: 0; font-size: 36px; font-weight: 800; letter-spacing: 8px; color: #C084FC; font-family: 'Courier New', monospace;">${code}</p>
        </div>

        <p style="color: rgba(244,242,247,0.4); font-size: 12px; line-height: 1.6; text-align: center;">
          If you didn't request this, you can safely ignore this email.<br/>
          Your vault remains locked and secure.
        </p>
      </div>
    `,
  });
}
