"use client";

import { Button, Card, Chip, Input } from "@heroui/react";
import {
  Calendar,
  Clock,
  CheckCircle2,
  XCircle,
  RefreshCw,
} from "lucide-react";
import React, { useState } from "react";

import { useDoctorContext } from "./doctor-context";

export function DoctorAppointmentsManager() {
  const { appointments, handleUpdateAppointment, fetchAppointments } = useDoctorContext();
  const [filterStatus, setFilterStatus] = useState<string>("ALL");
  const [searchQuery, setSearchQuery] = useState("");

  const filteredAppointments = appointments.filter((apt) => {
    const matchesStatus =
      filterStatus === "ALL" || apt.status === filterStatus;
    const matchesSearch =
      !searchQuery ||
      (apt.patient?.name || "").toLowerCase().includes(searchQuery.toLowerCase()) ||
      (apt.notes || "").toLowerCase().includes(searchQuery.toLowerCase());
    return matchesStatus && matchesSearch;
  });

  return (
    <Card className="p-6 border border-border-custom bg-surface/40 flex flex-col gap-6 shadow-sm">
      <div className="border-b border-border-custom pb-3 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-base font-bold text-text-primary flex items-center gap-2">
            <Calendar className="w-5 h-5 text-primary" />
            <span>Patient Appointments Manager</span>
          </h2>
          <p className="text-xs text-text-secondary mt-1">
            FR-DOC-09: View, accept, reschedule, cancel, and mark complete patient appointments against your schedule.
          </p>
        </div>

        <Button variant="secondary" size="sm" className="text-xs shrink-0 font-semibold" onPress={fetchAppointments}>
          <RefreshCw className="w-3.5 h-3.5 mr-1" /> Refresh Bookings
        </Button>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0">
          {["ALL", "PENDING", "CONFIRMED", "COMPLETED", "CANCELLED"].map((status) => (
            <Button
              key={status}
              variant={filterStatus === status ? "primary" : "secondary"}
              size="sm"
              className="text-xs font-semibold px-3"
              onPress={() => setFilterStatus(status)}
            >
              {status}
            </Button>
          ))}
        </div>

        <div className="w-full sm:w-64">
          <Input
            placeholder="Search patient name or notes..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="text-xs"
          />
        </div>
      </div>

      {filteredAppointments.length === 0 ? (
        <div className="p-12 text-center border border-dashed border-border-custom rounded-xl text-text-secondary text-xs flex flex-col items-center gap-2">
          <Calendar className="w-8 h-8 text-text-secondary/40" />
          <span>No patient appointments found matching the selected filter.</span>
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          {filteredAppointments.map((apt) => (
            <div
              key={apt.id}
              className="p-4 rounded-xl bg-surface/60 border border-border-custom flex flex-col md:flex-row md:items-center justify-between gap-4 transition-all hover:border-primary/40"
            >
              <div className="flex flex-col gap-1">
                <div className="flex items-center gap-2">
                  <span className="font-bold text-text-primary text-sm">
                    Patient: {apt.patient?.name || "Registered Patient"}
                  </span>
                  <Chip
                    variant="soft"
                    color={
                      apt.status === "CONFIRMED"
                        ? "success"
                        : apt.status === "COMPLETED"
                        ? "accent"
                        : apt.status === "CANCELLED"
                        ? "danger"
                        : "warning"
                    }
                    className="text-[10px] uppercase font-mono font-semibold"
                  >
                    {apt.status}
                  </Chip>
                </div>
                <span className="text-xs text-text-secondary flex items-center gap-1 font-mono">
                  <Clock className="w-3.5 h-3.5 text-primary" />
                  {new Date(apt.dateTime).toLocaleString()}
                </span>
                {apt.notes && (
                  <p className="text-xs text-text-secondary italic mt-1 font-serif">"{apt.notes}"</p>
                )}
              </div>

              <div className="flex items-center gap-2 shrink-0">
                {apt.status === "PENDING" && (
                  <Button
                    variant="primary"
                    size="sm"
                    className="text-xs font-semibold"
                    onPress={() => handleUpdateAppointment(apt.id, "CONFIRMED")}
                  >
                    <CheckCircle2 className="w-3.5 h-3.5 mr-1" /> Accept Booking
                  </Button>
                )}

                {apt.status === "CONFIRMED" && (
                  <Button
                    variant="secondary"
                    size="sm"
                    className="text-xs font-semibold text-emerald-400 border border-emerald-500/30"
                    onPress={() => handleUpdateAppointment(apt.id, "COMPLETED")}
                  >
                    <CheckCircle2 className="w-3.5 h-3.5 mr-1" /> Mark Complete
                  </Button>
                )}

                {apt.status !== "CANCELLED" && apt.status !== "COMPLETED" && (
                  <Button
                    variant="danger"
                    size="sm"
                    className="text-xs font-semibold"
                    onPress={() => handleUpdateAppointment(apt.id, "CANCELLED")}
                  >
                    <XCircle className="w-3.5 h-3.5 mr-1" /> Cancel
                  </Button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </Card>
  );
}
