"use client";

import React from "react";
import { DoctorLayoutWrapper } from "./doctor-layout-wrapper";
import { DoctorOverview } from "./doctor-overview";

export function DoctorDashboard() {
  return (
    <DoctorLayoutWrapper>
      <DoctorOverview />
    </DoctorLayoutWrapper>
  );
}
