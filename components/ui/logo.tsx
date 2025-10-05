import Image from "next/image";
import logo from "@/assets/logo.webp";
import { cn } from "@/lib/utils";

export const Logo = ({ className }: { className?: string }) => {
  return (
    <div className="flex items-center gap-2"> 
    <Image
      src={logo}
      alt="Logo"
      width={120}
      height={40}
      className={cn("w-16 h-16", className)}
    />
    </div>
  );
};
