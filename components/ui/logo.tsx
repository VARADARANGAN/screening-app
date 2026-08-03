import Image from "next/image";

export function LogoIcon({
  className,
}: {
  className?: string;
}) {
  return (
    <Image
      src="/logo.png"
      alt="EllipHire"
      width={32}
      height={32}
      priority
      className={`object-contain ${className || ""}`}
    />
  );
}

export function Logo({
  className,
}: {
  className?: string;
}) {
  return (
    <div className={`flex items-center gap-2.5 ${className || ""}`}>
      <LogoIcon className="h-full w-auto flex-shrink-0" />
      <span className="font-extrabold text-slate-900 tracking-tight text-2xl">
        EllipHire
      </span>
    </div>
  );
}
