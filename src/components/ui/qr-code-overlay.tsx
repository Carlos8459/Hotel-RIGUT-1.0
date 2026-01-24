import { cn } from "@/lib/utils"

export function QrCodeOverlay({ className }: { className?: string }) {
  return (
    <div className={cn("absolute inset-0 flex items-center justify-center pointer-events-none", className)}>
        <div className="w-64 h-64 border-4 border-white/80 rounded-lg shadow-lg" style={{boxShadow: '0 0 0 9999px rgba(0,0,0,0.6)'}} />
        <div className="absolute w-64 h-64">
             {/* Corner brackets */}
            <div className="absolute top-0 left-0 w-8 h-8 border-t-4 border-l-4 border-white rounded-tl-lg" />
            <div className="absolute top-0 right-0 w-8 h-8 border-t-4 border-r-4 border-white rounded-tr-lg" />
            <div className="absolute bottom-0 left-0 w-8 h-8 border-b-4 border-l-4 border-white rounded-bl-lg" />
            <div className="absolute bottom-0 right-0 w-8 h-8 border-b-4 border-r-4 border-white rounded-br-lg" />
        </div>
    </div>
  );
}