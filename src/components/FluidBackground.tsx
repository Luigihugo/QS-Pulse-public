"use client";

import LiquidEther from "@/components/LiquidEther";

const LIQUID_ETHER_PROPS = {
  colors: ["#5227FF", "#FF9FFC", "#B19EEF"],
  mouseForce: 20,
  cursorSize: 100,
  isViscous: true,
  viscous: 30,
  iterationsViscous: 32,
  iterationsPoisson: 32,
  resolution: 0.5,
  isBounce: false,
  autoDemo: true,
  autoSpeed: 0.5,
  autoIntensity: 2.2,
  takeoverDuration: 0.25,
  autoResumeDelay: 3000,
  autoRampDuration: 0.6,
};

export function FluidBackground({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="relative min-h-screen w-full">
      <div className="absolute inset-0 z-0">
        <LiquidEther
          {...LIQUID_ETHER_PROPS}
          style={{ width: "100%", height: "100%", minHeight: "100vh" }}
          className="absolute inset-0"
        />
      </div>
      <div className="relative z-10 flex min-h-screen flex-col items-center justify-center px-4 py-10">
        {children}
      </div>
    </div>
  );
}
