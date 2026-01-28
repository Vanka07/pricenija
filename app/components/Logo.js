'use client';

// Default Logo component - Icon only (to avoid duplicate text)
const Logo = ({ size = 'md' }) => {
  const sizes = {
    sm: 32,
    md: 40,
    lg: 52,
    xl: 64,
  };

  const iconSize = sizes[size] || sizes.md;

  return (
    <div
      className="bg-gradient-to-br from-emerald-500 to-green-600 flex flex-col items-center justify-center shadow-lg"
      style={{
        width: iconSize,
        height: iconSize,
        borderRadius: iconSize * 0.22,
      }}
    >
      {/* Naira Symbol */}
      <span
        className="font-black text-white leading-none"
        style={{
          fontSize: iconSize * 0.42,
          marginBottom: -iconSize * 0.02,
        }}
      >
        ₦
      </span>

      {/* Yellow Trendline with Upward Arrow */}
      <svg
        width={iconSize * 0.7}
        height={iconSize * 0.25}
        viewBox="0 0 35 12"
        fill="none"
        style={{ marginTop: -iconSize * 0.04 }}
      >
        {/* Trendline */}
        <path
          d="M3 10 L10 6 L17 8 L24 4 L31 2"
          stroke="#facc15"
          strokeWidth="2.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        {/* Arrow head */}
        <path
          d="M27 5 L31 2 L28 1"
          stroke="#facc15"
          strokeWidth="2.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    </div>
  );
};

export default Logo;
