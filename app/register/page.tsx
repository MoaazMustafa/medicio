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
  RadioGroup,
  Radio,
  Chip,
} from "@heroui/react";

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

      // Successful registration - refresh context and redirect
      router.push("/");
      router.refresh();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
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
                  Patient seeker
                </Radio>
                <Radio value="DOCTOR" className="text-xs text-text-primary">
                  Practitioner
                </Radio>
                <Radio value="PHARMACY_ADMIN" className="text-xs text-text-primary">
                  Pharmacy Admin
                </Radio>
                <Radio value="LAB_ADMIN" className="text-xs text-text-primary">
                  Lab Technician
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
