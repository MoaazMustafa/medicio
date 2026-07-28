"use client";

import {
  Card,
  CardHeader,
  CardContent,
  CardFooter,
  Button,
  Input,
} from "@heroui/react";
import NextLink from "next/link";
import { useRouter } from "next/navigation";
import React, { useState, useEffect, useCallback } from "react";
import { toast } from "sonner";

import { OtpInput } from "@/components/otp-input";

/** Cooldown duration in seconds before the send/resend button re-enables. */
const RESEND_COOLDOWN_SECONDS = 60;

export default function ForgotPasswordPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [otp, setOtp] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [step, setStep] = useState(1); // 1 = Request OTP, 2 = Verify OTP & Reset
  const [loading, setLoading] = useState(false);

  // Resend cooldown timer state
  const [cooldown, setCooldown] = useState(0);

  // Countdown effect — fires every second while cooldown > 0
  useEffect(() => {
    if (cooldown <= 0) return;

    const timer = setInterval(() => {
      setCooldown((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [cooldown]);

  const startCooldown = useCallback(() => {
    setCooldown(RESEND_COOLDOWN_SECONDS);
  }, []);

  const handleRequestOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) {
      toast.error("Please fill in your email address.");
      return;
    }

    setLoading(true);

    try {
      const response = await fetch("/api/auth/forgot-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });

      const data = await response.json();

      if (!response.ok) {
        if (response.status === 429) {
          toast.warning(data.error);
        } else {
          toast.error(data.error || "An unexpected error occurred.");
        }
        return;
      }

      toast.success("Verification code sent! Please check your email.");
      startCooldown();
      setStep(2);
    } catch (err: any) {
      toast.error(err.message || "Network error. Please check your connection.");
    } finally {
      setLoading(false);
    }
  };

  const handleResendOtp = async () => {
    if (!email) {
      toast.error("Email address is required to resend the code.");
      return;
    }

    setLoading(true);

    try {
      const response = await fetch("/api/auth/forgot-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });

      const data = await response.json();

      if (!response.ok) {
        if (response.status === 429) {
          toast.warning(data.error);
        } else {
          toast.error(data.error || "Failed to resend code.");
        }
        return;
      }

      toast.success("A fresh reset code has been sent!");
      startCooldown();
    } catch (err: any) {
      toast.error(err.message || "Network error. Please check your connection.");
    } finally {
      setLoading(false);
    }
  };

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!otp || !newPassword) {
      toast.error("Please fill in all verification details.");
      return;
    }

    setLoading(true);

    try {
      const response = await fetch("/api/auth/reset-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, otp, newPassword }),
      });

      const data = await response.json();

      if (!response.ok) {
        if (response.status === 429) {
          toast.warning(data.error);
        } else {
          toast.error(data.error || "An unexpected error occurred during password reset.");
        }
        return;
      }

      toast.success("Your password has been successfully reset! Redirecting to login...");
      setTimeout(() => {
        router.push("/login");
      }, 2000);
    } catch (err: any) {
      toast.error(err.message || "Network error. Please check your connection.");
    } finally {
      setLoading(false);
    }
  };

  const isSendDisabled = loading || cooldown > 0;

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
              isDisabled={isSendDisabled}
              className="w-full font-semibold h-11 mt-4 shadow-md"
            >
              {loading ? (
                <span className="flex items-center gap-2">
                  <span className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
                  Sending Code...
                </span>
              ) : cooldown > 0 ? (
                `Resend in ${cooldown}s`
              ) : (
                "Send Verification Code"
              )}
            </Button>
          </form>
        ) : (
          <form onSubmit={handleResetPassword}>
            <CardContent className="flex flex-col gap-4 p-0 pb-4">
              <div className="flex flex-col gap-2">
                <label className="text-xs font-semibold text-text-secondary">Verification Code (OTP)</label>
                <OtpInput value={otp} onChange={setOtp} disabled={loading} />
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

            <div className="flex flex-col gap-3 mt-4">
              <Button
                type="submit"
                variant="primary"
                isDisabled={loading}
                className="w-full font-semibold h-11 shadow-md"
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

              <Button
                type="button"
                variant="outline"
                isDisabled={isSendDisabled}
                onPress={handleResendOtp}
                className="w-full text-xs font-semibold text-text-primary"
              >
                {cooldown > 0
                  ? `Resend in ${cooldown}s`
                  : "Resend Reset Code"}
              </Button>
            </div>
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
