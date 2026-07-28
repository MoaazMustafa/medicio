"use client";

import {
  Card,
  CardHeader,
  CardContent,
  CardFooter,
  Button,
  Input,
  RadioGroup,
  Radio,
  Chip,
} from "@heroui/react";
import NextLink from "next/link";
import { useRouter } from "next/navigation";
import React, { useState } from "react";

import { dashboardForRole } from "@/config/roles";

export default function RegisterPage() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState("PATIENT");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !email || !password || !role) {
      setError("Please complete all registration details.");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const response = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, email, password, role }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "An unexpected error occurred during signup.");
      }

      if (data.requiresVerification) {
        router.push(`/verify-email?email=${encodeURIComponent(email)}`);
      } else {
        router.push(dashboardForRole(data.user.role));
        router.refresh();
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleLogin = () => {
    // The server issues the anti-CSRF state and builds the authorization URL.
    window.location.href = "/api/auth/google";
  };

  return (
    <section className="flex items-center justify-center min-h-[80vh] px-4 py-12">
      <Card className="w-full max-w-lg p-6 border border-border-custom bg-surface/50 backdrop-blur-md shadow-xl">
        <CardHeader className="flex flex-col gap-1 items-start p-0 pb-6 text-left">
          <h2 className="text-2xl font-bold tracking-tight text-text-primary">Create Your Account</h2>
          <p className="text-sm text-text-secondary">
            Join the Medicio digital healthcare network.
          </p>
        </CardHeader>

        <form onSubmit={handleRegister}>
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
              <label className="text-xs font-semibold text-text-secondary">Full Name</label>
              <Input
                type="text"
                placeholder="Jane Doe"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
                className="px-3 py-2 border border-border-custom bg-background-custom/30 rounded-lg text-sm text-text-primary focus:outline-none focus:ring-1 focus:ring-primary w-full"
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-semibold text-text-secondary">Email address</label>
              <Input
                type="email"
                placeholder="jane@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="px-3 py-2 border border-border-custom bg-background-custom/30 rounded-lg text-sm text-text-primary focus:outline-none focus:ring-1 focus:ring-primary w-full"
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-semibold text-text-secondary">Password</label>
              <Input
                type="password"
                placeholder="Minimum 6 characters"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="px-3 py-2 border border-border-custom bg-background-custom/30 rounded-lg text-sm text-text-primary focus:outline-none focus:ring-1 focus:ring-primary w-full"
              />
            </div>

            <RadioGroup
              value={role}
              onChange={setRole}
              className="mt-2 flex flex-col gap-1.5"
            >
              <label className="text-xs font-semibold text-text-secondary">Account Role Type</label>
              <div className="grid grid-cols-2 gap-3 mt-1 text-sm">
                <Radio value="PATIENT" className="text-xs text-text-primary">
                  Patient Seeker
                </Radio>
                <Radio value="DOCTOR" className="text-xs text-text-primary">
                  Medical Practitioner
                </Radio>
              </div>
            </RadioGroup>
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
                Creating Account...
              </span>
            ) : (
              "Sign Up"
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
          <span>Already registered? </span>
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
