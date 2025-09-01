export interface LensOSLogoProps {
  size?: number;
  className?: string;
}

export function LensOSLogo({ size = 120, className = "" }: LensOSLogoProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 120 120"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
    >
      <defs>
        {/* Main gradient for the lens */}
        <radialGradient
          id="lensGradient"
          cx="0.5"
          cy="0.3"
          r="0.8"
          gradientUnits="objectBoundingBox"
        >
          <stop offset="0%" stopColor="#E0E7FF" />
          <stop offset="30%" stopColor="#8B5CF6" />
          <stop offset="70%" stopColor="#3B82F6" />
          <stop offset="100%" stopColor="#1E40AF" />
        </radialGradient>

        {/* Secondary gradient for geometric elements */}
        <linearGradient
          id="techGradient"
          x1="0%"
          y1="0%"
          x2="100%"
          y2="100%"
        >
          <stop offset="0%" stopColor="#C0C7D0" />
          <stop offset="50%" stopColor="#8B5CF6" />
          <stop offset="100%" stopColor="#1E40AF" />
        </linearGradient>

        {/* Inner lens gradient */}
        <radialGradient
          id="innerLens"
          cx="0.5"
          cy="0.4"
          r="0.6"
          gradientUnits="objectBoundingBox"
        >
          <stop offset="0%" stopColor="#FFFFFF" stopOpacity="0.9" />
          <stop offset="40%" stopColor="#E0E7FF" stopOpacity="0.6" />
          <stop offset="100%" stopColor="#8B5CF6" stopOpacity="0.3" />
        </radialGradient>

        {/* Reflection gradient */}
        <linearGradient
          id="reflection"
          x1="0%"
          y1="0%"
          x2="100%"
          y2="70%"
        >
          <stop offset="0%" stopColor="#FFFFFF" stopOpacity="0.8" />
          <stop offset="100%" stopColor="#FFFFFF" stopOpacity="0" />
        </linearGradient>
      </defs>

      {/* Outer geometric ring */}
      <circle
        cx="60"
        cy="60"
        r="56"
        fill="none"
        stroke="url(#techGradient)"
        strokeWidth="1"
        opacity="0.4"
      />

      {/* Tech geometric elements - prism lines */}
      <g opacity="0.6">
        <line x1="20" y1="40" x2="100" y2="80" stroke="url(#techGradient)" strokeWidth="0.5" />
        <line x1="20" y1="80" x2="100" y2="40" stroke="url(#techGradient)" strokeWidth="0.5" />
        <line x1="40" y1="20" x2="80" y2="100" stroke="url(#techGradient)" strokeWidth="0.5" />
        <line x1="80" y1="20" x2="40" y2="100" stroke="url(#techGradient)" strokeWidth="0.5" />
      </g>

      {/* Main lens circle */}
      <circle
        cx="60"
        cy="60"
        r="45"
        fill="url(#lensGradient)"
      />

      {/* Inner lens reflection */}
      <circle
        cx="60"
        cy="60"
        r="35"
        fill="url(#innerLens)"
      />

      {/* Central focal point */}
      <circle
        cx="60"
        cy="60"
        r="12"
        fill="url(#techGradient)"
        opacity="0.8"
      />

      {/* Inner focal ring */}
      <circle
        cx="60"
        cy="60"
        r="8"
        fill="none"
        stroke="#FFFFFF"
        strokeWidth="1"
        opacity="0.9"
      />

      {/* Highlight reflection */}
      <ellipse
        cx="50"
        cy="45"
        rx="15"
        ry="25"
        fill="url(#reflection)"
        transform="rotate(-20 50 45)"
      />

      {/* Geometric accent lines */}
      <g opacity="0.7">
        <circle cx="60" cy="60" r="25" fill="none" stroke="url(#techGradient)" strokeWidth="0.5" />
        <circle cx="60" cy="60" r="20" fill="none" stroke="#FFFFFF" strokeWidth="0.3" opacity="0.5" />
      </g>

      {/* Corner tech elements */}
      <g opacity="0.4">
        <rect x="15" y="15" width="8" height="1" fill="url(#techGradient)" />
        <rect x="15" y="15" width="1" height="8" fill="url(#techGradient)" />

        <rect x="97" y="15" width="8" height="1" fill="url(#techGradient)" />
        <rect x="104" y="15" width="1" height="8" fill="url(#techGradient)" />

        <rect x="15" y="104" width="8" height="1" fill="url(#techGradient)" />
        <rect x="15" y="97" width="1" height="8" fill="url(#techGradient)" />

        <rect x="97" y="104" width="8" height="1" fill="url(#techGradient)" />
        <rect x="104" y="97" width="1" height="8" fill="url(#techGradient)" />
      </g>
    </svg>
  );
}