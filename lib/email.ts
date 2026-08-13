import nodemailer from "nodemailer";
import { dashboardForRole } from "@/config/roles";

/**
 * Common configuration interface for email template generation
 */
interface EmailTemplateOptions {
  title: string;
  subtitle?: string;
  greetingName?: string;
  bodyContent: string;
  badge?: { text: string; color?: "teal" | "blue" | "amber" | "green" | "red" };
  detailsTable?: { label: string; value: string }[];
  ctaButton?: { text: string; url: string };
  securityNote?: string;
}

/**
 * Generates a responsive HTML string adhering to the Medicio Clinical Design System.
 * Theme tokens: Primary Teal (#0D9488), Accent (#0F766E), Light Surface (#FFFFFF, #F8FAFC), Dark text (#0F172A, #334155).
 */
function buildEmailHtml(options: EmailTemplateOptions): string {
  const badgeColorMap = {
    teal: "background-color: #ccfbf1; color: #0d9488; border: 1px solid #99f6e4;",
    blue: "background-color: #dbeafe; color: #1d4ed8; border: 1px solid #bfdbfe;",
    amber: "background-color: #fef3c7; color: #b45309; border: 1px solid #fde68a;",
    green: "background-color: #dcfce7; color: #15803d; border: 1px solid #bbf7d0;",
    red: "background-color: #fee2e2; color: #b91c1c; border: 1px solid #fca5a5;",
  };

  const badgeStyle = options.badge
    ? badgeColorMap[options.badge.color || "teal"]
    : badgeColorMap.teal;

  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>${options.title}</title>
    </head>
    <body style="margin: 0; padding: 0; background-color: #f1f5f9; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;">
      <div style="max-width: 600px; margin: 30px auto; background-color: #ffffff; border-radius: 12px; border: 1px solid #e2e8f0; overflow: hidden; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05);">
        
        <!-- Header -->
        <div style="background-color: #0d9488; padding: 28px 32px; text-align: center;">
          <h1 style="color: #ffffff; margin: 0; font-size: 28px; font-weight: 800; letter-spacing: -0.025em; text-transform: uppercase;">Medicio</h1>
          <p style="color: #ccfbf1; margin: 4px 0 0 0; font-size: 12px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.12em;">AI-Powered Healthcare Access Platform</p>
        </div>

        <!-- Body Container -->
        <div style="padding: 32px; background-color: #ffffff;">
          
          ${
            options.badge
              ? `<div style="text-align: center; margin-bottom: 20px;">
                  <span style="display: inline-block; padding: 6px 16px; border-radius: 9999px; font-size: 12px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.05em; ${badgeStyle}">
                    ${options.badge.text}
                  </span>
                 </div>`
              : ""
          }

          <h2 style="color: #0f172a; margin-top: 0; font-size: 20px; font-weight: 700; text-align: center;">
            ${options.title}
          </h2>

          ${
            options.greetingName
              ? `<p style="font-size: 15px; color: #334155; line-height: 1.6; margin-top: 16px;">Hello <strong>${options.greetingName}</strong>,</p>`
              : ""
          }

          <div style="font-size: 15px; color: #334155; line-height: 1.6; margin-top: 12px;">
            ${options.bodyContent}
          </div>

          ${
            options.detailsTable && options.detailsTable.length > 0
              ? `<div style="margin: 24px 0; background-color: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; padding: 16px 20px;">
                  <table style="width: 100%; border-collapse: collapse;">
                    ${options.detailsTable
                      .map(
                        (row) => `
                        <tr>
                          <td style="padding: 6px 0; font-size: 13px; font-weight: 600; color: #64748b; width: 40%; border-bottom: 1px solid #f1f5f9;">${row.label}</td>
                          <td style="padding: 6px 0; font-size: 14px; font-weight: 600; color: #0f172a; text-align: right; border-bottom: 1px solid #f1f5f9;">${row.value}</td>
                        </tr>
                      `
                      )
                      .join("")}
                  </table>
                 </div>`
              : ""
          }

          ${
            options.ctaButton
              ? `<div style="text-align: center; margin: 30px 0 20px 0;">
                  <a href="${options.ctaButton.url}" style="background-color: #0d9488; color: #ffffff; text-decoration: none; padding: 12px 28px; border-radius: 8px; font-size: 14px; font-weight: 700; display: inline-block; box-shadow: 0 2px 4px rgba(13, 148, 136, 0.2);">
                    ${options.ctaButton.text}
                  </a>
                 </div>`
              : ""
          }

          ${
            options.securityNote
              ? `<div style="margin-top: 24px; padding: 12px 16px; background-color: #fffbeb; border: 1px solid #fef3c7; border-radius: 6px; font-size: 12px; color: #92400e; line-height: 1.5;">
                  <strong>Security Alert:</strong> ${options.securityNote}
                 </div>`
              : ""
          }

        </div>

        <!-- Footer -->
        <div style="background-color: #f8fafc; border-top: 1px solid #e2e8f0; padding: 24px 32px; text-align: center;">
          <p style="font-size: 11px; color: #64748b; line-height: 1.5; margin: 0 0 10px 0;">
            <strong>Medical Disclaimer:</strong> Medicio automated notifications provide operational status updates only. AI guidance and platform metrics do not replace professional clinical evaluation or emergency medical triage.
          </p>
          <p style="font-size: 11px; color: #94a3b8; margin: 0;">
            © 2026 Medicio Healthcare Inc. All rights reserved. Access logs monitored under clinical RBAC protocols.
          </p>
        </div>

      </div>
    </body>
    </html>
  `;
}

/**
 * Low-level email dispatch wrapper using Nodemailer with Gmail SMTP.
 */
async function sendEmail(to: string, subject: string, html: string): Promise<boolean> {
  if (!process.env.GMAIL_USER || !process.env.GMAIL_APP_PASSWORD) {
    if (process.env.NODE_ENV === "production") {
      console.error(`[email] GMAIL_USER / GMAIL_APP_PASSWORD not set in production — cannot send "${subject}".`);
      return false;
    }
    console.warn(`[email] GMAIL_USER / GMAIL_APP_PASSWORD not set — skipping dispatch for "${subject}" to ${to} (dev mode).`);
    return true;
  }

  const transporter = nodemailer.createTransport({
    service: "gmail",
    auth: {
      user: process.env.GMAIL_USER,
      pass: process.env.GMAIL_APP_PASSWORD,
    },
  });

  try {
    const rawFrom = process.env.GMAIL_FROM || "";
    const cleanFrom = rawFrom
      .replace(/\\"/g, "")
      .replace(/"/g, "")
      .replace(/\u201C|\u201D/g, "")
      .replace(/'/g, "")
      .trim();
    const from = cleanFrom || `Medicio Portal <${process.env.GMAIL_USER}>`;

    await transporter.sendMail({
      from,
      to,
      subject,
      html,
    });
    return true;
  } catch (error) {
    console.error(`[email] Error sending email (${subject}) to ${to}:`, error);
    return false;
  }
}

// -----------------------------------------------------------------------------
// Specialized Email Dispatch Functions
// -----------------------------------------------------------------------------

/**
 * 1. Dispatches account verification OTP email.
 */
export async function sendOtpEmail(email: string, otp: string, purpose: string): Promise<boolean> {
  const html = buildEmailHtml({
    title: "Verification Code Required",
    badge: { text: "Action Required", color: "teal" },
    bodyContent: `You requested a code to verify your identity for <strong>${purpose}</strong>. Please use the single-use code below to complete verification:`,
    detailsTable: [
      { label: "Verification Code", value: `<span style="font-family: monospace; font-size: 20px; color: #0d9488; letter-spacing: 4px;">${otp}</span>` },
      { label: "Validity", value: "15 Minutes" },
    ],
    securityNote: "Do not share this OTP with anyone. Medicio support staff will never ask for your verification code.",
  });

  return sendEmail(email, `[Medicio] Verification Code: ${otp}`, html);
}

/**
 * 2. Dispatches welcome email for new signups.
 */
export async function sendWelcomeEmail(email: string, name: string, role: string): Promise<boolean> {
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
  const targetPath = dashboardForRole(role);

  const html = buildEmailHtml({
    title: "Welcome to Medicio!",
    greetingName: name,
    badge: { text: "Account Activated", color: "green" },
    bodyContent: `Thank you for joining <strong>Medicio</strong>, your AI-powered clinical portal. Your account has been successfully verified and activated.`,
    detailsTable: [
      { label: "Account Name", value: name },
      { label: "Account Email", value: email },
      { label: "Assigned Role", value: role.replace("_", " ") },
    ],
    ctaButton: { text: "Access Medicio Portal", url: `${appUrl}${targetPath}` },
  });

  return sendEmail(email, "Welcome to Medicio Healthcare Platform", html);
}

/**
 * 3. Dispatches login detection security email.
 */
export async function sendLoginDetectedEmail(
  email: string,
  name: string,
  details: { time: string; ip?: string; userAgent?: string },
  role?: string
): Promise<boolean> {
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
  const targetPath = dashboardForRole(role);

  const table = [
    { label: "Date & Time", value: details.time },
    { label: "IP Address", value: details.ip || "Unknown IP" },
  ];

  if (details.userAgent) {
    table.push({ label: "Device / Browser", value: details.userAgent.slice(0, 50) });
  }

  const html = buildEmailHtml({
    title: "New Sign-In Detected",
    greetingName: name,
    badge: { text: "Security Alert", color: "amber" },
    bodyContent: `We detected a successful sign-in to your Medicio account. If this was you, no action is required.`,
    detailsTable: table,
    securityNote: `If you did not sign in recently, please reset your password immediately or contact Medicio security team.`,
    ctaButton: { text: "Go to Dashboard", url: `${appUrl}${targetPath}` },
  });

  return sendEmail(email, "[Medicio Security] New Sign-In to Your Account", html);
}

/**
 * 4. Dispatches notice when a user's role is updated by an administrator.
 */
export async function sendRoleChangedEmail(
  email: string,
  name: string,
  oldRole: string,
  newRole: string
): Promise<boolean> {
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
  const targetPath = dashboardForRole(newRole);

  const html = buildEmailHtml({
    title: "Account Role Updated",
    greetingName: name,
    badge: { text: "Role Changed", color: "blue" },
    bodyContent: `An administrator has updated your access role on the Medicio platform. Your permissions and dashboard views have been adjusted accordingly.`,
    detailsTable: [
      { label: "Previous Role", value: oldRole.replace("_", " ") },
      { label: "New Access Role", value: newRole.replace("_", " ") },
    ],
    ctaButton: { text: "Go to Portal", url: `${appUrl}${targetPath}` },
  });

  return sendEmail(email, "[Medicio] Your Account Role Has Been Updated", html);
}

/**
 * 5. Dispatches confirmation when a doctor submits verification credentials.
 */
export async function sendDoctorApplicationSubmittedEmail(
  email: string,
  name: string,
  specialty: string
): Promise<boolean> {
  const html = buildEmailHtml({
    title: "Verification Application Submitted",
    greetingName: name,
    badge: { text: "Under Review", color: "amber" },
    bodyContent: `Thank you for submitting your clinical credentials to Medicio. Our administrative audit team is reviewing your verification documents.`,
    detailsTable: [
      { label: "Practitioner Name", value: `Dr. ${name}` },
      { label: "Specialty", value: specialty },
      { label: "Audit Status", value: "Pending Administrator Approval" },
    ],
  });

  return sendEmail(email, "[Medicio] Doctor Verification Application Received", html);
}

/**
 * 6. Dispatches approval email when a doctor's verification is approved.
 */
export async function sendDoctorApplicationApprovedEmail(
  email: string,
  name: string,
  specialty: string
): Promise<boolean> {
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";

  const html = buildEmailHtml({
    title: "Doctor Credentials Approved!",
    greetingName: name,
    badge: { text: "Verified Doctor", color: "green" },
    bodyContent: `Congratulations! Your medical practitioner credentials have been verified by Medicio administrators. Your clinical profile and AI Specialty Agent are now active.`,
    detailsTable: [
      { label: "Practitioner", value: `Dr. ${name}` },
      { label: "Specialty", value: specialty },
      { label: "Verification Status", value: "Approved & Live" },
    ],
    ctaButton: { text: "Open Doctor Dashboard", url: `${appUrl}/doctor/dashboard` },
  });

  return sendEmail(email, "Congratulations! Your Medicio Doctor Profile is Verified", html);
}

/**
 * 7. Dispatches rejection email when a doctor's verification is rejected.
 */
export async function sendDoctorApplicationRejectedEmail(
  email: string,
  name: string,
  specialty: string,
  reason?: string
): Promise<boolean> {
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";

  const html = buildEmailHtml({
    title: "Verification Application Decision",
    greetingName: name,
    badge: { text: "Verification Rejected", color: "red" },
    bodyContent: `Our administration team reviewed your practitioner credentials and was unable to approve your application at this time.`,
    detailsTable: [
      { label: "Specialty", value: specialty },
      { label: "Reason / Notes", value: reason || "Credentials could not be validated. Please check license details." },
    ],
    ctaButton: { text: "Resubmit Credentials", url: `${appUrl}/doctor/dashboard` },
  });

  return sendEmail(email, "[Medicio] Doctor Verification Application Status Update", html);
}

/**
 * 8. Dispatches appointment booking notifications to patient and doctor.
 */
export async function sendAppointmentBookedEmail(params: {
  patientEmail: string;
  patientName: string;
  doctorEmail: string;
  doctorName: string;
  dateTime: string;
  notes?: string;
}): Promise<boolean> {
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";

  // Patient Email
  const patientHtml = buildEmailHtml({
    title: "Appointment Request Submitted",
    greetingName: params.patientName,
    badge: { text: "Booking Pending", color: "teal" },
    bodyContent: `Your appointment request with <strong>Dr. ${params.doctorName}</strong> has been received.`,
    detailsTable: [
      { label: "Doctor", value: `Dr. ${params.doctorName}` },
      { label: "Date & Time", value: params.dateTime },
      { label: "Notes", value: params.notes || "None" },
      { label: "Status", value: "Pending Confirmation" },
    ],
    ctaButton: { text: "View Clinical Assistant", url: `${appUrl}/chatbot` },
  });

  // Doctor Email
  const doctorHtml = buildEmailHtml({
    title: "New Appointment Request",
    greetingName: params.doctorName,
    badge: { text: "New Request", color: "blue" },
    bodyContent: `A patient has requested an appointment with you. Please review and manage the schedule.`,
    detailsTable: [
      { label: "Patient Name", value: params.patientName },
      { label: "Patient Email", value: params.patientEmail },
      { label: "Date & Time", value: params.dateTime },
      { label: "Patient Notes", value: params.notes || "None" },
    ],
    ctaButton: { text: "Manage Appointments", url: `${appUrl}/doctor/dashboard` },
  });

  const pSent = await sendEmail(params.patientEmail, `[Medicio] Appointment Request: Dr. ${params.doctorName}`, patientHtml);
  const dSent = await sendEmail(params.doctorEmail, `[Medicio] New Patient Booking Request: ${params.patientName}`, doctorHtml);

  return pSent && dSent;
}

/**
 * 9. Dispatches appointment status update email (Confirmed/Rescheduled/Cancelled/Completed).
 */
export async function sendAppointmentStatusEmail(params: {
  patientEmail: string;
  patientName: string;
  doctorEmail: string;
  doctorName: string;
  dateTime: string;
  status: string;
  notes?: string;
}): Promise<boolean> {
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";

  const colorMap: Record<string, "green" | "amber" | "red" | "blue"> = {
    CONFIRMED: "green",
    RESCHEDULED: "amber",
    CANCELLED: "red",
    COMPLETED: "blue",
  };

  const badgeColor = colorMap[params.status.toUpperCase()] || "teal";

  const html = buildEmailHtml({
    title: `Appointment ${params.status}`,
    greetingName: params.patientName,
    badge: { text: `Status: ${params.status}`, color: badgeColor },
    bodyContent: `Your appointment with <strong>Dr. ${params.doctorName}</strong> is now marked as <strong>${params.status}</strong>.`,
    detailsTable: [
      { label: "Doctor", value: `Dr. ${params.doctorName}` },
      { label: "Date & Time", value: params.dateTime },
      { label: "Updated Status", value: params.status },
      ...(params.notes ? [{ label: "Notes", value: params.notes }] : []),
    ],
    ctaButton: { text: "Open Medicio Portal", url: `${appUrl}/chatbot` },
  });

  return sendEmail(params.patientEmail, `[Medicio] Appointment Update: ${params.status}`, html);
}

/**
 * 10. Dispatches hospital affiliation request/status notice.
 */
export async function sendHospitalAffiliationEmail(params: {
  recipientEmail: string;
  recipientName: string;
  hospitalName: string;
  doctorName: string;
  status: string;
  actionRequestedBy?: string;
}): Promise<boolean> {
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";

  const html = buildEmailHtml({
    title: "Hospital Affiliation Notice",
    greetingName: params.recipientName,
    badge: { text: `Affiliation: ${params.status}`, color: "teal" },
    bodyContent: `There is an update regarding the hospital affiliation between <strong>Dr. ${params.doctorName}</strong> and <strong>${params.hospitalName}</strong>.`,
    detailsTable: [
      { label: "Doctor", value: `Dr. ${params.doctorName}` },
      { label: "Hospital", value: params.hospitalName },
      { label: "Affiliation Status", value: params.status },
    ],
    ctaButton: { text: "Open Clinical Dashboard", url: `${appUrl}/hospital/dashboard` },
  });

  return sendEmail(params.recipientEmail, `[Medicio] Hospital Affiliation Update: ${params.status}`, html);
}

/**
 * 11. Dispatches password change security alert.
 */
export async function sendPasswordChangedEmail(email: string, name: string): Promise<boolean> {
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";

  const html = buildEmailHtml({
    title: "Password Changed",
    greetingName: name,
    badge: { text: "Security Alert", color: "amber" },
    bodyContent: `The password for your Medicio account was successfully changed.`,
    securityNote: `If you did not perform this password change, please contact Medicio security immediately to lock your account.`,
    ctaButton: { text: "Sign In", url: `${appUrl}/login` },
  });

  return sendEmail(email, "[Medicio Security] Your Password Was Changed", html);
}

/**
 * 12. Dispatches notification when a lab uploads a report for a patient.
 */
export async function sendLabReportUploadedEmail(params: {
  patientEmail: string;
  patientName: string;
  labName: string;
  testName: string;
}): Promise<boolean> {
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";

  const html = buildEmailHtml({
    title: "New Diagnostic Lab Report Ready",
    greetingName: params.patientName,
    badge: { text: "Lab Report Ready", color: "green" },
    bodyContent: `<strong>${params.labName}</strong> has uploaded a new diagnostic test report for you.`,
    detailsTable: [
      { label: "Test Name", value: params.testName },
      { label: "Diagnostic Facility", value: params.labName },
      { label: "Status", value: "Ready to Download" },
    ],
    ctaButton: { text: "View Report in Portal", url: `${appUrl}/chatbot` },
  });

  return sendEmail(params.patientEmail, `[Medicio] Diagnostic Report Ready: ${params.testName}`, html);
}

/**
 * 13. Dispatches general administrative broadcast notification email.
 */
export async function sendBroadcastEmail(params: {
  recipientEmail: string;
  recipientName: string;
  title: string;
  bodyContent: string;
  href?: string;
  category?: string;
}): Promise<boolean> {
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";

  const html = buildEmailHtml({
    title: params.title,
    greetingName: params.recipientName,
    badge: { text: params.category || "Official Announcement", color: "teal" },
    bodyContent: `<p style="white-space: pre-line; margin: 0;">${params.bodyContent}</p>`,
    ctaButton: params.href
      ? { text: "Open Notification Link", url: params.href.startsWith("http") ? params.href : `${appUrl}${params.href}` }
      : { text: "Open Medicio Portal", url: `${appUrl}/chatbot` },
  });

  return sendEmail(params.recipientEmail, `[Medicio Alert] ${params.title}`, html);
}
