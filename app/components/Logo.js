'use client';

const Logo = ({ size = 'md' }) => {
  const sizes = {
    sm: 'w-10 h-10',
    md: 'w-12 h-12',
    lg: 'w-16 h-16',
  };
  const svgSizes = {
    sm: 'w-6 h-6',
    md: 'w-8 h-8',
    lg: 'w-10 h-10',
  };
  return (
    <div
      className={`${sizes[size]} bg-gradient-to-br from-green-400 to-green-600 rounded-xl flex items-center justify-center shadow-lg`}
    >
      <svg viewBox="0 0 40 40" className={svgSizes[size]}>
        <text
          x="20"
          y="21"
          textAnchor="middle"
          fill="white"
          fontSize="17"
          fontWeight="bold"
          fontFamily="system-ui"
        >
          ₦
        </text>
        <path
          d="M8 32 L16 28 L24 30 L32 24"
          stroke="#FBBF24"
          strokeWidth="2.5"
          fill="none"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <path
          d="M30 26 L32 24 L30 22"
          stroke="#FBBF24"
          strokeWidth="2"
          fill="none"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    </div>
  );
};

export default Logo;
