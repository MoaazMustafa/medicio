"use client";

import React, { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
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

function VerifyEmailForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const emailParam = searchParams.get("email") || "";

  const [email, setEmail] = useState(emailParam);
  const [otp, setOtp] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [resendLoading, setResendLoading] = useState(false);

  useEffect(() => {
    if (emailParam) {
      setEmail(emailParam);
    }
  }, [emailParam]);

  const handleVerify = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !otp) {
      setError("Please input your email and the 6-digit confirmation code.");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const response = await fetch("/api/auth/verify-email", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, otp }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Verification failed.");
      }

      setSuccess("Account activated successfully! Logging you in...");
      setTimeout(() => {
        router.push("/");
        router.refresh();
      }, 1500);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async () => {
    if (!email) {
      setError("Please fill in your email address to request a new code.");
      return;
    }

    setResendLoading(true);
    setError(null);
    setSuccess(null);

    try {
      const response = await fetch("/api/auth/forgot-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to resend code.");
      }

      setSuccess("A fresh verification code has been sent!");
    } catch (err: any) {
      setError(err.message);
    } finally {
      setResendLoading(false);
    }
  };

  return (
    <Card className="w-full max-w-md p-6 border border-border-custom bg-surface/50 backdrop-blur-md shadow-xl">
      <CardHeader className="flex flex-col gap-1 items-start p-0 pb-6 text-left">
        <h2 className="text-2xl font-bold tracking-tight text-text-primary">Email Verification</h2>
        <p className="text-sm text-text-secondary font-sans">
          Confirm your account activation using the verification OTP code sent to your email.
        </p>
      </CardHeader>

      <form onSubmit={handleVerify}>
        <CardContent className="flex flex-col gap-4 p-0 pb-4">
          {error && (
            <Chip color="danger" className="w-full text-xs font-semibold py-2 px-3 text-center">
              {error}
            </Chip>
          )}
          {success && (
            <Chip color="success" className="w-full text-xs font-semibold py-2 px-3 text-center text-text-primary">
              {success}
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

          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-semibold text-text-secondary">Verification Code (6-digit OTP)</label>
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
                Verifying Account...
              </span>
            ) : (
              "Confirm Activation"
            )}
          </Button>

          <Button
            type="button"
            variant="outline"
            isDisabled={resendLoading}
            onPress={handleResend}
            className="w-full text-xs font-semibold text-text-primary"
          >
            {resendLoading ? "Resending..." : "Resend Verification Code"}
          </Button>
        </div>
      </form>

      <hr className="border-t border-border-custom my-5" />

      <CardFooter className="p-0 flex justify-center text-xs text-text-secondary">
        <span>Already verified? </span>
        <NextLink
          href="/login"
          className="text-primary hover:underline font-semibold ml-1.5"
        >
          Sign In
        </NextLink>
      </CardFooter>
    </Card>
  );
}

export default function VerifyEmailPage() {
  return (
    <section className="flex items-center justify-center min-h-[75vh] px-4 py-12">
      <Suspense fallback={
        <Card className="w-full max-w-md p-6 border border-border-custom bg-surface/50 backdrop-blur-md shadow-xl text-center">
          <div className="py-12 flex justify-center">
            <span className="w-8 h-8 border-3 border-primary border-t-transparent rounded-full animate-spin" />
          </div>
        </Card>
      }>
        <VerifyEmailForm />
      </Suspense>
    </section>
  );
}
