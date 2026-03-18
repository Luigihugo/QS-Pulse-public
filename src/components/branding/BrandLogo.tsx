import Image from "next/image";

interface BrandLogoProps {
  variant?: "full" | "icon";
  className?: string;
}

export function BrandLogo({ variant = "full", className }: BrandLogoProps) {
  if (variant === "icon") {
    return (
      <div className={className}>
        <Image
          src="/QSpulse.svg"
          alt="QS Pulse"
          width={120}
          height={32}
          className="h-7 w-auto"
        />
      </div>
    );
  }

  return (
    <div className={className}>
      <Image
        src="/QSpulse.svg"
        alt="QS Pulse"
        width={320}
        height={90}
        className="h-auto w-full max-w-xs"
        priority
      />
    </div>
  );
}

