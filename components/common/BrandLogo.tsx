import React from "react";
import Image from "next/image";

interface BrandLogoProps {
  showTagline?: boolean;
  size?: "sm" | "md" | "lg";
  className?: string;
}

export function BrandLogo({ showTagline = false, size = "md", className = "" }: BrandLogoProps) {
  // Size specifications:
  // Desktop: Logo 48px, Text text-xl
  // Tablet: Logo 42px, Text text-lg
  // Mobile: Logo 36px, Text text-base
  const sizeClasses = {
    sm: {
      text: "text-sm",
      logo: "w-[30px] h-[30px]",
    },
    md: {
      text: "text-base md:text-lg lg:text-xl",
      logo: "w-[36px] h-[36px] md:w-[42px] md:h-[42px] lg:w-[48px] lg:h-[48px]", // Responsive
    },
    lg: {
      text: "text-xl",
      logo: "w-[48px] h-[48px]", // 48px
    },
  };

  const currentSize = sizeClasses[size];

  const lockup = (
    <div className="flex items-center gap-1 flex-shrink-0">
      <div className={`relative flex-shrink-0 ${currentSize.logo}`}>
        <Image
          src="/logo.png"
          alt="EllipHire Logo"
          fill
          priority
          className="object-contain"
        />
      </div>
      <span className={`font-bold text-slate-900 tracking-tight ${currentSize.text}`}>
        EllipHire
      </span>
    </div>
  );

  if (!showTagline) {
    return (
      <div className={`flex items-center ${className}`}>
        {lockup}
      </div>
    );
  }

  return (
    <div className={`flex flex-col justify-center items-center ${className}`}>
      {lockup}
      <p className="text-[11px] text-slate-500 font-medium tracking-wide mt-1 text-center">
        Smart Assessment & Recruitment Platform
      </p>
    </div>
  );
}
