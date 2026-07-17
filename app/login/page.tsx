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

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

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
        throw new Error(data.error || "An unexpected error occurred during login.");
      }

      // Successful login - refresh context and redirect
      router.push("/");
      router.refresh();
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
    </section>
  );
}
