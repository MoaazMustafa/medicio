"use client";

import { Button, Chip } from "@heroui/react";
import {
  Calendar,
  CheckCircle2,
  Clock,
  ExternalLink,
  HelpCircle,
  Lock,
  MapPin,
  Send,
  Stethoscope,
  User,
} from "lucide-react";
import NextLink from "next/link";
import React from "react";

export interface AppointmentBookingData {
  appointmentId?: string;
  doctorId: string;
  doctorName: string;
  doctorSpecialty: string;
  doctorAvatar?: string | null;
  hospitalName?: string | null;
  clinicAddress?: string | null;
  consultationFee?: number | null;
  dateTime: string;
  status: "PREVIEW" | "PENDING" | "CONFIRMED" | "CANCELLED" | "COMPLETED" | "AUTH_REQUIRED";
  notes?: string | null;
}

interface BookingCardProps {
  booking: AppointmentBookingData;
  isAuthRequired?: boolean;
  onConfirmBooking?: (booking: AppointmentBookingData) => void;
}

export function BookingCard({
  booking,
  isAuthRequired = false,
  onConfirmBooking,
}: BookingCardProps) {
  const isPreview = booking.status === "PREVIEW";
  const dateObj = new Date(booking.dateTime);
  const formattedDate = isNaN(dateObj.getTime())
    ? booking.dateTime
    : dateObj.toLocaleDateString(undefined, {
        weekday: "short",
        month: "short",
        day: "numeric",
        year: "numeric",
      });
  const formattedTime = isNaN(dateObj.getTime())
    ? ""
    : dateObj.toLocaleTimeString(undefined, {
        hour: "2-digit",
        minute: "2-digit",
      });

  return (
    <div className="w-full max-w-xl rounded-2xl border border-primary/30 bg-surface/95 p-4 shadow-sm backdrop-blur-xs transition-all sm:p-5">
      {/* Header Badge */}
      <div className="flex items-center justify-between gap-2 border-b border-border-custom pb-3">
        <div className="flex items-center gap-2">
          {isAuthRequired ? (
            <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-amber-500/10 text-amber-500">
              <Lock className="h-4 w-4" />
            </div>
          ) : isPreview ? (
            <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-primary/10 text-primary">
              <HelpCircle className="h-4 w-4" />
            </div>
          ) : (
            <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-emerald-500/10 text-emerald-500">
              <CheckCircle2 className="h-4 w-4" />
            </div>
          )}
          <span className="text-xs font-bold text-text-primary">
            {isAuthRequired
              ? "Login Required to Finalize Slot"
              : isPreview
              ? "Confirm Appointment Details"
              : "Appointment Slot Reserved"}
          </span>
        </div>

        <Chip
          className="text-[10px] font-mono font-bold uppercase"
          color={isAuthRequired ? "warning" : isPreview ? "accent" : "success"}
          variant="soft"
        >
          {isAuthRequired ? "Action Required" : isPreview ? "Awaiting Confirmation" : booking.status}
        </Chip>
      </div>

      {/* Doctor & Schedule Grid */}
      <div className="grid gap-3 pt-3 sm:grid-cols-2">
        {/* Doctor Info */}
        <div className="flex items-start gap-2.5 rounded-xl border border-border-custom bg-background-custom/40 p-3">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
            <Stethoscope className="h-4 w-4" />
          </div>
          <div className="flex flex-col min-w-0">
            <span className="truncate text-xs font-bold text-text-primary">
              Dr. {booking.doctorName}
            </span>
            <span className="truncate text-[11px] text-text-secondary">
              {booking.doctorSpecialty}
            </span>
            {booking.hospitalName && (
              <span className="truncate text-[10px] text-text-secondary/80">
                {booking.hospitalName}
              </span>
            )}
          </div>
        </div>

        {/* Schedule Time */}
        <div className="flex items-start gap-2.5 rounded-xl border border-border-custom bg-background-custom/40 p-3">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
            <Calendar className="h-4 w-4" />
          </div>
          <div className="flex flex-col min-w-0">
            <span className="text-xs font-bold text-text-primary">
              {formattedDate}
            </span>
            <span className="flex items-center gap-1 text-[11px] text-text-secondary">
              <Clock className="h-3 w-3 text-primary" /> {formattedTime || "Scheduled Time"}
            </span>
            {booking.consultationFee && (
              <span className="text-[10px] font-mono font-semibold text-primary">
                Fee: ${booking.consultationFee}
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Address / Location */}
      {booking.clinicAddress && (
        <div className="mt-2.5 flex items-center gap-1.5 text-[11px] text-text-secondary">
          <MapPin className="h-3.5 w-3.5 shrink-0 text-primary" />
          <span className="truncate">{booking.clinicAddress}</span>
        </div>
      )}

      {/* Footer Actions */}
      <div className="mt-3.5 flex flex-wrap items-center justify-between gap-2 border-t border-border-custom pt-3">
        {isAuthRequired ? (
          <>
            <p className="text-[11px] text-text-secondary">
              Please sign in to confirm this reservation with Dr. {booking.doctorName}.
            </p>
            <NextLink href={`/login?redirect=/appointments&doctorId=${booking.doctorId}`}>
              <Button size="sm" variant="primary" className="text-xs font-semibold">
                <User className="mr-1 h-3.5 w-3.5" /> Sign in &amp; Confirm
              </Button>
            </NextLink>
          </>
        ) : isPreview ? (
          <>
            <span className="text-[11px] text-text-secondary">
              Ready to submit? Click confirm or reply with changes.
            </span>
            <div className="flex items-center gap-2">
              <Button
                size="sm"
                variant="primary"
                className="text-xs font-bold shadow-sm"
                onPress={() => onConfirmBooking?.(booking)}
              >
                <Send className="mr-1 h-3.5 w-3.5" /> Confirm Booking
              </Button>
            </div>
          </>
        ) : (
          <>
            <span className="text-[10px] text-text-secondary">
              Status is PENDING doctor confirmation. An alert has been sent.
            </span>
            <NextLink href="/appointments">
              <Button size="sm" variant="primary" className="text-xs font-semibold">
                <ExternalLink className="mr-1 h-3.5 w-3.5" /> View in My Appointments
              </Button>
            </NextLink>
          </>
        )}
      </div>
    </div>
  );
}
