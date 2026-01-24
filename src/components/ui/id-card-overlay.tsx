import { cn } from "@/lib/utils"

export function IdCardOverlay({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 400 250"
      className={cn("absolute inset-0 w-full h-full pointer-events-none", className)}
      preserveAspectRatio="xMidYMid slice"
    >
      {/* Background overlay */}
      <defs>
        <mask id="id-card-mask">
          <rect width="100%" height="100%" fill="white" />
          <rect
            x="20"
            y="25"
            width="360"
            height="200"
            rx="12"
            ry="12"
            fill="black"
          />
        </mask>
      </defs>
      <rect
        width="100%"
        height="100%"
        fill="black"
        fillOpacity="0.6"
        mask="url(#id-card-mask)"
      />

      {/* Border and corners */}
      <rect
        x="20"
        y="25"
        width="360"
        height="200"
        rx="12"
        ry="12"
        fill="none"
        stroke="white"
        strokeWidth="2"
        strokeDasharray="10 5"
      />
      {/* Corner brackets */}
      <path d="M 30 25 L 20 25 L 20 35" stroke="white" strokeWidth="4" fill="none" />
      <path d="M 370 25 L 380 25 L 380 35" stroke="white" strokeWidth="4" fill="none" />
      <path d="M 30 225 L 20 225 L 20 215" stroke="white" strokeWidth="4" fill="none" />
      <path d="M 370 225 L 380 225 L 380 215" stroke="white" strokeWidth="4" fill="none" />
    </svg>
  );
}
