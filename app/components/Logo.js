'use client';

const Logo = ({ size = 'md', showTagline = false, dark = true }) => {
  const sizes = {
    sm: { icon: 32, text: 'text-base', gap: 'gap-2' },
    md: { icon: 40, text: 'text-xl', gap: 'gap-2.5' },
    lg: { icon: 52, text: 'text-2xl', gap: 'gap-3' },
    xl: { icon: 64, text: 'text-3xl', gap: 'gap-4' },
  };

  const { icon: iconSize, text: textSize, gap } = sizes[size] || sizes.md;

  return (
    <div className={`flex items-center ${gap}`}>
      {/* Logo Icon */}
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

      {/* Logo Text */}
      <div className="flex flex-col">
        <div className="flex items-baseline">
          <span
            className={`${textSize} font-bold tracking-tight ${
              dark ? 'text-white' : 'text-gray-900'
            }`}
          >
            Price
          </span>
          <span className={`${textSize} font-bold tracking-tight text-emerald-500`}>
            Nija
          </span>
        </div>
        {showTagline && (
          <span
            className={`text-[8px] tracking-[0.1em] ${
              dark ? 'text-gray-400' : 'text-gray-500'
            } uppercase -mt-0.5`}
          >
            Track • Compare • Save
          </span>
        )}
      </div>
    </div>
  );
};

// Icon-only export for favicon/app icon usage
export const LogoIcon = ({ size = 40 }) => (
  <div
    className="bg-gradient-to-br from-emerald-500 to-green-600 flex flex-col items-center justify-center shadow-lg"
    style={{
      width: size,
      height: size,
      borderRadius: size * 0.22,
    }}
  >
    <span
      className="font-black text-white leading-none"
      style={{
        fontSize: size * 0.42,
        marginBottom: -size * 0.02,
      }}
    >
      ₦
    </span>
    <svg
      width={size * 0.7}
      height={size * 0.25}
      viewBox="0 0 35 12"
      fill="none"
      style={{ marginTop: -size * 0.04 }}
    >
      <path
        d="M3 10 L10 6 L17 8 L24 4 L31 2"
        stroke="#facc15"
        strokeWidth="2.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
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

export default Logo;
