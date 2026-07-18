/**
 * Centralized Audit Logger
 * Ensures sensitive data like passwords, OTPs, reset tokens, and secrets are scrubbed before logging.
 */
export function logAuthEvent(event: string, details: Record<string, any>) {
  const scrubbedDetails = { ...details };
  const sensitiveKeys = [
    "password",
    "otp",
    "token",
    "secret",
    "access_token",
    "newPassword",
    "passwordHash",
    "key",
  ];

  for (const key of sensitiveKeys) {
    if (key in scrubbedDetails) {
      scrubbedDetails[key] = "[REDACTED]";
    }
  }

  // Outputs formatted structured log to terminal console for tracing
  console.log(
    `[AUTH AUDIT LOG] [${new Date().toISOString()}] Event: ${event} | Details:`,
    JSON.stringify(scrubbedDetails)
  );
}
