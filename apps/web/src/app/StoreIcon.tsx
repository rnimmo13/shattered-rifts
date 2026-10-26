// The Store's mark: a satchel with a rift crystal set in its flap. It stands for anything bought in the Store (on the home button,
// the Store page, and later the price of each cosmetic), drawn here so it scales and takes the theme's colours.

import { useId } from 'react';

export function StoreIcon(props: { size?: number; className?: string }) {
  const size = props.size ?? 28;
  // (each icon its own gradient id: the home page and the Store show several)
  const grad = `store-crystal-${useId().replace(/:/g, '')}`;
  return (
    <svg
      className={props.className}
      width={size}
      height={size}
      viewBox="0 0 32 32"
      aria-hidden
      focusable="false"
    >
      <defs>
        <linearGradient id={grad} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#bff3ff" />
          <stop offset="0.55" stopColor="#5fc8ff" />
          <stop offset="1" stopColor="#8a5cff" />
        </linearGradient>
      </defs>
      {/* the strap and the bag */}
      <path
        d="M11 10 C11 5.5 21 5.5 21 10"
        fill="none"
        stroke="#d4a84b"
        strokeWidth="2"
        strokeLinecap="round"
      />
      <path
        d="M6 11.5 H26 L24.5 26.5 C24.4 27.4 23.7 28 22.8 28 H9.2 C8.3 28 7.6 27.4 7.5 26.5 Z"
        fill="#1b2450"
        stroke="#d4a84b"
        strokeWidth="1.6"
        strokeLinejoin="round"
      />
      {/* the crystal in the flap */}
      <path
        d="M16 13.5 L20 18 L16 25 L12 18 Z"
        fill={`url(#${grad})`}
        stroke="#e9f8ff"
        strokeWidth="0.8"
        strokeLinejoin="round"
      />
      <path d="M12 18 H20 M16 13.5 V25" stroke="#e9f8ff" strokeWidth="0.5" opacity="0.6" />
    </svg>
  );
}
