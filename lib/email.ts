import nodemailer from "nodemailer";

/**
 * Medicio Email Sending Service (Gmail)
 * Dispatches verification emails through Gmail using Nodemailer.
 * Requires a Google App Password (myaccount.google.com/apppasswords) —
 * regular Gmail passwords will not work.
 */
export async function sendOtpEmail(email: string, otp: string, purpose: string): Promise<boolean> {
  // In development, skip gracefully; in production the credentials are mandatory.
  if (!process.env.GMAIL_USER || !process.env.GMAIL_APP_PASSWORD) {
    if (process.env.NODE_ENV === "production") {
      console.error("[email] GMAIL_USER / GMAIL_APP_PASSWORD not set in production — cannot send OTP.");
      return false;
    }
    console.warn("[email] GMAIL_USER / GMAIL_APP_PASSWORD not set — skipping OTP email dispatch (dev mode).");
    return true;
  }

  // Construct transporter dynamically so that runtime updates of .env parameters are read instantly
  const transporter = nodemailer.createTransport({
    service: "gmail",
    auth: {
      user: process.env.GMAIL_USER,
      pass: process.env.GMAIL_APP_PASSWORD,
    },
  });
  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 30px; border: 1px solid #e2e8f0; border-radius: 12px; background-color: #ffffff;">
      <div style="text-align: center; margin-bottom: 30px;">
        <h1 style="color: #0d9488; margin: 0; font-size: 28px; font-weight: 800; tracking-tight: -0.05em;">Medicio</h1>
        <p style="font-size: 13px; color: #64748b; margin: 5px 0 0 0; text-transform: uppercase; letter-spacing: 0.1em;">Healthcare Access Platform</p>
      </div>
      <div style="padding: 25px; background-color: #f8fafc; border-radius: 8px; border: 1px solid #f1f5f9;">
        <h2 style="color: #0f172a; margin-top: 0; font-size: 18px; font-weight: 700;">Verification Required</h2>
        <p style="font-size: 15px; color: #334155; line-height: 1.6; margin-top: 8px;">
          You requested a code to verify your identity for <strong>${purpose}</strong>. 
          Please use the following single-use verification code:
        </p>
        <div style="text-align: center; margin: 30px 0;">
          <span style="font-family: 'Courier New', Courier, monospace; font-size: 34px; font-weight: 800; letter-spacing: 8px; color: #0d9488; background-color: #ccfbf1; padding: 12px 24px; border-radius: 6px; border: 1.5px dashed #0d9488; display: inline-block;">
            ${otp}
          </span>
        </div>
        <p style="font-size: 13px; color: #64748b; line-height: 1.5; margin-bottom: 0;">
          This code is only valid for 15 minutes. Do not share this OTP with anyone, including Medicio support personnel. If you did not trigger this action, please change your credentials immediately.
        </p>
      </div>
      <hr style="border: 0; border-top: 1px solid #e2e8f0; margin: 25px 0;" />
      <p style="font-size: 11px; text-align: center; color: #94a3b8; line-height: 1.4;">
        © 2026 Medicio Healthcare Inc. All transmission logs are audit-tracked under clinical RBAC protocols.
      </p>
    </div>
  `;

  try {
    // Build a clean RFC 5321 sender address.  GMAIL_FROM from .env or Vercel
    // env vars may contain escaped quotes, smart quotes, or stray backslashes
    // that Gmail rejects with "555 5.5.2 Syntax error".  Strip them all out
    // and fall back to a safe default built from GMAIL_USER.
    const rawFrom = process.env.GMAIL_FROM || "";
    const cleanFrom = rawFrom
      .replace(/\\"/g, "")       // escaped double quotes
      .replace(/"/g, "")         // regular double quotes
      .replace(/\u201C|\u201D/g, "") // smart quotes
      .replace(/'/g, "")         // single quotes
      .trim();
    const from = cleanFrom || `Medicio Portal <${process.env.GMAIL_USER}>`;

    await transporter.sendMail({
      from,
      to: email,
      subject: `[Medicio] Verification Code: ${otp}`,
      html: html,
    });
    return true;
  } catch (error) {
    console.error("[email] Nodemailer Gmail Transporter Error:", error);
    return false;
  }
}

