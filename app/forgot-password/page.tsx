"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import NextLink from "next/link";
import {
  Card,
  CardHeader,
  CardContent,
  CardFooter,
  Button,
  Input,
  Chip,
} from "@heroui/react";

export default function ForgotPasswordPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [otp, setOtp] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [step, setStep] = useState(1); // 1 = Request OTP, 2 = Verify OTP & Reset
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const handleRequestOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) {
      setError("Please fill in your email address.");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const response = await fetch("/api/auth/forgot-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "An unexpected error occurred.");
      }

      setSuccessMessage("Verification code sent! Please check your console/email.");
      setStep(2);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!otp || !newPassword) {
      setError("Please fill in all verification details.");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const response = await fetch("/api/auth/reset-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, otp, newPassword }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "An unexpected error occurred during password reset.");
      }

      setSuccessMessage("Your password has been successfully reset! Redirecting to login...");
      setTimeout(() => {
        router.push("/login");
      }, 2000);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <section className="flex items-center justify-center min-h-[75vh] px-4 py-12">
      <Card className="w-full max-w-md p-6 border border-border-custom bg-surface/50 backdrop-blur-md shadow-xl">
        <CardHeader className="flex flex-col gap-1 items-start p-0 pb-6 text-left">
          <h2 className="text-2xl font-bold tracking-tight text-text-primary">Reset Password</h2>
          <p className="text-sm text-text-secondary">
            {step === 1 
              ? "Request a 6-digit OTP verification code to reset credentials." 
              : "Verify your code and enter your new password below."}
          </p>
        </CardHeader>

        {step === 1 ? (
          <form onSubmit={handleRequestOtp}>
            <CardContent className="flex flex-col gap-4 p-0 pb-4">
              {error && (
                <Chip color="danger" className="w-full text-xs font-semibold py-2 px-3 text-center">
                  {error}
                </Chip>
              )}

              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-semibold text-text-secondary">Email address</label>
                <Input
                  type="email"
                  placeholder="you@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className="px-3 py-2 border border-border-custom bg-background-custom/30 rounded-lg text-sm text-text-primary focus:outline-none focus:ring-1 focus:ring-primary w-full"
                />
              </div>
            </CardContent>

            <Button
              type="submit"
              variant="primary"
              isDisabled={loading}
              className="w-full font-semibold h-11 mt-4 shadow-md"
            >
              {loading ? (
                <span className="flex items-center gap-2">
                  <span className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
                  Sending Code...
                </span>
              ) : (
                "Send Verification Code"
              )}
            </Button>
          </form>
        ) : (
          <form onSubmit={handleResetPassword}>
            <CardContent className="flex flex-col gap-4 p-0 pb-4">
              {error && (
                <Chip color="danger" className="w-full text-xs font-semibold py-2 px-3 text-center">
                  {error}
                </Chip>
              )}
              {successMessage && (
                <Chip color="success" className="w-full text-xs font-semibold py-2 px-3 text-center text-text-primary">
                  {successMessage}
                </Chip>
              )}

              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-semibold text-text-secondary">Verification Code (OTP)</label>
                <Input
                  type="text"
                  placeholder="6-digit OTP code"
                  value={otp}
                  onChange={(e) => setOtp(e.target.value)}
                  maxLength={6}
                  required
                  className="px-3 py-2 border border-border-custom bg-background-custom/30 rounded-lg text-sm text-text-primary focus:outline-none focus:ring-1 focus:ring-primary w-full tracking-widest font-mono text-center font-bold"
                />
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-semibold text-text-secondary">New Password</label>
                <Input
                  type="password"
                  placeholder="Minimum 6 characters"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  required
                  className="px-3 py-2 border border-border-custom bg-background-custom/30 rounded-lg text-sm text-text-primary focus:outline-none focus:ring-1 focus:ring-primary w-full"
                />
              </div>
            </CardContent>

            <Button
              type="submit"
              variant="primary"
              isDisabled={loading}
              className="w-full font-semibold h-11 mt-4 shadow-md"
            >
              {loading ? (
                <span className="flex items-center gap-2">
                  <span className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
                  Resetting Password...
                </span>
              ) : (
                "Verify & Reset Password"
              )}
            </Button>
          </form>
        )}

        <hr className="border-t border-border-custom my-5" />

        <CardFooter className="p-0 flex justify-center text-xs text-text-secondary">
          <span>Remember your credentials? </span>
          <NextLink
            href="/login"
            className="text-primary hover:underline font-semibold ml-1.5"
          >
            Sign In
          </NextLink>
        </CardFooter>
      </Card>
    </section>
  );
}
