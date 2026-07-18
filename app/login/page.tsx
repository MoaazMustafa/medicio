"use client";

import {
  Card,
  CardHeader,
  CardContent,
  CardFooter,
  Button,
  Input,
  Chip,
} from "@heroui/react";
import NextLink from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import React, { useState, useEffect, Suspense } from "react";

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const urlError = searchParams.get("error");

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (urlError) {
      setError(decodeURIComponent(urlError));
    }
  }, [urlError]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      setError("Please fill in all credentials.");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const response = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });

      const data = await response.json();

      if (!response.ok) {
        if (response.status === 403 && data.requiresVerification) {
          router.push(`/verify-email?email=${encodeURIComponent(email)}`);
          return;
        }
        throw new Error(data.error || "An unexpected error occurred during login.");
      }

      // Successful login - refresh context and redirect
      const dashboards: Record<string, string> = {
        PATIENT: "/chatbot",
        DOCTOR: "/doctor/dashboard",
        PHARMACY_ADMIN: "/pharmacy/dashboard",
        LAB_ADMIN: "/lab/dashboard",
        HOSPITAL_ADMIN: "/hospital/dashboard",
        ADMIN: "/admin/dashboard",
        SUPER_ADMIN: "/admin/dashboard",
      };
      const redirectPath = dashboards[data.user.role] || "/";
      router.push(redirectPath);
      router.refresh();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleLogin = () => {
    const clientId = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID || "";
    const appUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
    const redirectUri = encodeURIComponent(`${appUrl}/api/auth/callback/google`);
    const scope = encodeURIComponent("openid email profile");
    const googleAuthUrl = `https://accounts.google.com/o/oauth2/v2/auth?client_id=${clientId}&redirect_uri=${redirectUri}&response_type=code&scope=${scope}&prompt=select_account`;
    window.location.href = googleAuthUrl;
  };

  return (
    <Card className="w-full max-w-md p-6 border border-border-custom bg-surface/50 backdrop-blur-md shadow-xl">
      <CardHeader className="flex flex-col gap-1 items-start p-0 pb-6 text-left">
        <h2 className="text-2xl font-bold tracking-tight text-text-primary">Welcome Back</h2>
        <p className="text-sm text-text-secondary">
          Sign in to access your Medicio healthcare portal.
        </p>
      </CardHeader>

      <form onSubmit={handleLogin}>
        <CardContent className="flex flex-col gap-4 p-0 pb-4">
          {error && (
            <Chip
              color="danger"
              className="w-full text-xs font-semibold py-2 px-3 flex items-center justify-center max-w-full text-center"
            >
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

          <div className="flex flex-col gap-1.5">
            <div className="flex justify-between items-center">
              <label className="text-xs font-semibold text-text-secondary">Password</label>
              <NextLink
                href="/forgot-password"
                className="text-xs text-primary hover:underline font-semibold"
              >
                Forgot Password?
              </NextLink>
            </div>
            <Input
              type="password"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
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
              Signing In...
            </span>
          ) : (
            "Sign In"
          )}
        </Button>

        <div className="flex items-center gap-3 my-3">
          <hr className="flex-1 border-t border-border-custom/50" />
          <span className="text-[10px] uppercase font-mono text-text-secondary">or connect via</span>
          <hr className="flex-1 border-t border-border-custom/50" />
        </div>

        <Button
          type="button"
          variant="outline"
          onPress={handleGoogleLogin}
          className="w-full font-semibold h-11 flex items-center justify-center gap-2 text-text-primary hover:bg-border-custom/30 border-border-custom"
        >
          <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
            <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
            <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
            <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
            <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
          </svg>
          Google Identity
        </Button>
      </form>

      <hr className="border-t border-border-custom my-5" />

      <CardFooter className="p-0 flex justify-center text-xs text-text-secondary">
        <span>Don't have an account? </span>
        <NextLink
          href="/register"
          className="text-primary hover:underline font-semibold ml-1.5"
        >
          Create Account
        </NextLink>
      </CardFooter>
    </Card>
  );
}

export default function LoginPage() {
  return (
    <section className="flex items-center justify-center min-h-[75vh] px-4 py-12">
      <Suspense fallback={
        <Card className="w-full max-w-md p-6 border border-border-custom bg-surface/50 backdrop-blur-md shadow-xl text-center">
          <div className="py-12 flex justify-center">
            <span className="w-8 h-8 border-3 border-primary border-t-transparent rounded-full animate-spin" />
          </div>
        </Card>
      }>
        <LoginForm />
      </Suspense>
    </section>
  );
}
