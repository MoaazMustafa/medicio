/**
 * Medicio Email Sending Service
 * In development mode, drafts are logged to the console for testing.
 */
export async function sendOtpEmail(email: string, otp: string, purpose: string): Promise<boolean> {
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

  // Log draft details directly to console for instant developer feedback
  console.log(`
[EMAIL SYSTEM INFO] Sending OTP mail to ${email} for "${purpose}".
--------------------------------------------------------------------------------
Subject: [Medicio] Verification Code: ${otp}
Recipient: ${email}
--------------------------------------------------------------------------------
OTP: ${otp}
Expires: 15 Minutes
--------------------------------------------------------------------------------
HTML DRAFT:
${html}
================================================================================
`);

  return true;
}
