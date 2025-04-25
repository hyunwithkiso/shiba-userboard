import Image from "next/image";
import logo from "@/assets/logo.webp";
import { cn } from "@/lib/utils";

export const Logo = ({ className }: { className?: string }) => {
  return (
    <Image
      src={logo}
      alt="Logo"
      width={64}
      height={64}
      className={cn("w-10 h-10", className)}
    />
  );
};
