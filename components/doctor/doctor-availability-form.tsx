"use client";

import { Button, Card, Input, Label } from "@heroui/react";
import { Clock } from "lucide-react";
import React from "react";

import { useDoctorContext } from "./doctor-context";

export function DoctorAvailabilityForm() {
  const {
    workingDays,
    toggleDay,
    workingHoursStart,
    setWorkingHoursStart,
    workingHoursEnd,
    setWorkingHoursEnd,
    slotDuration,
    setSlotDuration,
    handleSaveAvailability,
    saving,
  } = useDoctorContext();

  return (
    <Card className="p-6 border border-border-custom bg-surface/40 flex flex-col gap-6 shadow-sm">
      <div className="border-b border-border-custom pb-3">
        <h2 className="text-base font-bold text-text-primary flex items-center gap-2">
          <Clock className="w-5 h-5 text-primary" />
          <span>Practitioner Availability Timetable</span>
        </h2>
        <p className="text-xs text-text-secondary mt-1">
          FR-DOC-03: Doctors directly control their own consultation availability, even when affiliated with a hospital (FR-DOC-04).
        </p>
      </div>

      <div className="flex flex-col gap-6">
        <div>
          <Label className="text-xs font-bold text-text-primary block mb-2">Select Working Days:</Label>
          <div className="flex flex-wrap gap-2">
            {["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"].map((day) => {
              const selected = workingDays.includes(day);
              return (
                <Button
                  key={day}
                  variant={selected ? "primary" : "secondary"}
                  size="sm"
                  className="text-xs font-semibold"
                  onPress={() => toggleDay(day)}
                >
                  {day}
                </Button>
              );
            })}
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="flex flex-col gap-1.5">
            <Label className="text-xs font-semibold text-text-primary">Working Hours Start</Label>
            <Input
              type="time"
              value={workingHoursStart}
              onChange={(e) => setWorkingHoursStart(e.target.value)}
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <Label className="text-xs font-semibold text-text-primary">Working Hours End</Label>
            <Input
              type="time"
              value={workingHoursEnd}
              onChange={(e) => setWorkingHoursEnd(e.target.value)}
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <Label className="text-xs font-semibold text-text-primary">Slot Duration (Minutes)</Label>
            <Input
              type="number"
              value={String(slotDuration)}
              onChange={(e) => setSlotDuration(Number(e.target.value))}
            />
          </div>
        </div>

        <div className="p-4 rounded-xl bg-background-custom/40 border border-border-custom/60 flex flex-col gap-2">
          <span className="text-xs font-bold text-text-primary">Current Published Schedule Preview:</span>
          <div className="text-xs text-text-secondary flex flex-wrap gap-6">
            <span>
              <strong>Working Days:</strong> {workingDays.join(", ") || "None selected"}
            </span>
            <span>
              <strong>Shift Hours:</strong> {workingHoursStart} - {workingHoursEnd}
            </span>
            <span>
              <strong>Session Slot:</strong> {slotDuration} Minutes
            </span>
          </div>
        </div>

        <div className="flex justify-end">
          <Button variant="primary" onPress={handleSaveAvailability} isDisabled={saving} className="px-6 font-semibold text-xs">
            {saving ? "Publishing Timetable..." : "Publish Availability Schedule"}
          </Button>
        </div>
      </div>
    </Card>
  );
}
