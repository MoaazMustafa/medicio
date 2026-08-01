
"use client";

import { MotionConfig } from "framer-motion";

import { AiWorkflow } from "@/components/landing/ai-workflow";
import { Benefits } from "@/components/landing/benefits";
import { Comparison } from "@/components/landing/comparison";
import { DashboardShowcase } from "@/components/landing/dashboard-showcase";
import { Faq } from "@/components/landing/faq";
import { Features } from "@/components/landing/features";
import { FinalCta } from "@/components/landing/final-cta";
import { Hero } from "@/components/landing/hero";
import { Pricing } from "@/components/landing/pricing";
import { ProductOverview } from "@/components/landing/product-overview";
import { Testimonials } from "@/components/landing/testimonials";
import { TrustedBy } from "@/components/landing/trusted-by";

export default function Home() {
  return (
    <MotionConfig reducedMotion="user">
      <div className="flex w-full flex-col overflow-x-clip">
        <Hero />
        <TrustedBy />
        <ProductOverview />
        <Features />
        <DashboardShowcase />
        <AiWorkflow />
        <Benefits />
        <Comparison />
        <Testimonials />
        <Pricing />
        <Faq />
        <FinalCta />
      </div>
    </MotionConfig>
  );
}
