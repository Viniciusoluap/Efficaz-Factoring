export default function LogoEfficaz({ size = 40, className = '' }: { size?: number; className?: string }) {
  const id = 'ef-grad';
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 40 40"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      aria-label="Efficaz Factoring"
    >
      <defs>
        <linearGradient id={id} x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#1e3a8a" />
          <stop offset="100%" stopColor="#0f1f5c" />
        </linearGradient>
      </defs>
      <rect width="40" height="40" rx="9" fill={`url(#${id})`} />
      <text
        x="20"
        y="27"
        fontFamily="Arial, Helvetica, sans-serif"
        fontSize="16"
        fontWeight="700"
        fill="#fbbf24"
        textAnchor="middle"
        letterSpacing="0.5"
      >
        EF
      </text>
    </svg>
  );
}
