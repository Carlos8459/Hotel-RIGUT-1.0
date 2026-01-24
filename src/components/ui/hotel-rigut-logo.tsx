import * as React from 'react';

export const HotelRigutLogo = (props: React.SVGProps<SVGSVGElement>) => (
  <svg
    viewBox="0 0 160 140"
    xmlns="http://www.w3.org/2000/svg"
    {...props}
  >
    {/* Base */}
    <path d="M4 131.5H156" stroke="hsl(var(--primary))" strokeOpacity="0.7" strokeWidth="5" strokeLinecap="round" />

    {/* Main Building */}
    <path d="M37.3333 131.5V40.5L122.667 40.5V131.5" fill="hsl(var(--primary))" stroke="hsl(var(--primary))" strokeWidth="5" strokeLinejoin="round"/>
    
    {/* Side Wings */}
    <path d="M4 110.5L37.3333 40.5V131.5H4V110.5Z" fill="hsl(var(--accent))" stroke="hsl(var(--primary))" strokeWidth="5" strokeLinejoin="round" />
    <path d="M156 110.5L122.667 40.5V131.5H156V110.5Z" fill="hsl(var(--accent))" stroke="hsl(var(--primary))" strokeWidth="5" strokeLinejoin="round"/>
    
    {/* Wing Lines */}
    <path d="M12.3333 131.5V108.833" stroke="hsl(var(--primary) / 0.5)" strokeWidth="3" strokeLinecap="round" />
    <path d="M19.3333 131.5V100.833" stroke="hsl(var(--primary) / 0.5)" strokeWidth="3" strokeLinecap="round" />
    <path d="M26.3333 131.5V92.8333" stroke="hsl(var(--primary) / 0.5)" strokeWidth="3" strokeLinecap="round" />
    <path d="M147.667 131.5V108.833" stroke="hsl(var(--primary) / 0.5)" strokeWidth="3" strokeLinecap="round" />
    <path d="M140.667 131.5V100.833" stroke="hsl(var(--primary) / 0.5)" strokeWidth="3" strokeLinecap="round" />
    <path d="M133.667 131.5V92.8333" stroke="hsl(var(--primary) / 0.5)" strokeWidth="3" strokeLinecap="round" />
    
    {/* Door */}
    <path d="M71.3333 131.5V98.1667H88.6667V131.5" fill="hsl(var(--background) / 0.5)" stroke="hsl(var(--background))" strokeWidth="2" strokeLinejoin="round" />
    <path d="M75.8333 131.5V110.833H84.1667V131.5" fill="hsl(var(--background) / 0.5)" />
    
    {/* Windows */}
    <g fill="hsl(var(--background) / 0.7)">
      <rect x="44" y="50" width="10" height="10" rx="2"/>
      <rect x="59" y="50" width="10" height="10" rx="2"/>
      <rect x="91" y="50" width="10" height="10" rx="2"/>
      <rect x="106" y="50" width="10" height="10" rx="2"/>
      
      <rect x="44" y="67" width="10" height="10" rx="2"/>
      <rect x="59" y="67" width="10" height="10" rx="2"/>
      <rect x="91" y="67" width="10" height="10" rx="2"/>
      <rect x="106" y="67" width="10" height="10" rx="2"/>

      <rect x="44" y="84" width="10" height="10" rx="2"/>
      <rect x="59" y="84" width="10" height="10" rx="2"/>
      
      <rect x="91" y="84" width="10" height="10" rx="2"/>
      <rect x="106" y="84" width="10" height="10" rx="2"/>

      <rect x="44" y="101" width="10" height="10" rx="2"/>
      <rect x="59" y="101" width="10" height="10" rx="2"/>
      <rect x="91" y="101" width="10" height="10" rx="2"/>
      <rect x="106" y="101" width="10" height="10" rx="2"/>
    </g>

    {/* Sign */}
    <rect x="51.3333" y="12.8333" width="57.3333" height="18.6667" rx="3" fill="hsl(var(--background))" stroke="hsl(var(--primary))" strokeWidth="3"/>
    <text x="80" y="27" textAnchor="middle" fontFamily="Poppins, sans-serif" fontSize="12" fontWeight="bold" fill="hsl(var(--foreground))">HOTEL</text>
    <path d="M74 31.5V40.5" stroke="hsl(var(--primary))" strokeWidth="3" strokeLinecap="round" />
    <path d="M86 31.5V40.5" stroke="hsl(var(--primary))" strokeWidth="3" strokeLinecap="round" />
  </svg>
);
