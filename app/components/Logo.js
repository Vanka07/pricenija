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
          y="26"
          textAnchor="middle"
          fill="white"
          fontSize="24"
          fontWeight="bold"
          fontFamily="system-ui"
        >
          ₦
        </text>
        {/* Uptrend arrow matching reference logo style, in yellow */}
        <path
          d="M7 32 L15 22 L20 26 L29 12"
          stroke="#FBBF24"
          strokeWidth="3"
          fill="none"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <path
          d="M23 12 L29 12 L29 18"
          stroke="#FBBF24"
          strokeWidth="3"
          fill="none"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    </div>
  );
};

export default Logo;
