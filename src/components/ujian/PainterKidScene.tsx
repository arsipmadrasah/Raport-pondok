import { forwardRef } from 'react';

interface PainterKidSceneProps {
  className?: string;
}

/**
 * 2D bold-outline cartoon Santri character:
 * Santri boy with black peci (songkok), white collared shirt, plaid sarung,
 * white socks, black shoes, carrying a bucket of water, animated via GSAP.
 */
export const PainterKidScene = forwardRef<HTMLDivElement, PainterKidSceneProps>(
  ({ className = '' }, ref) => {
    return (
      <div ref={ref} className={`painter-scene ${className}`} aria-hidden="true">
        {/* Physics-driven water-like fluid throw & splash canvas */}
        <canvas data-part="fluid-canvas" className="fluid-canvas" />

        {/* Soft organic splash aura behind the card */}
        <svg
          className="paint-splash-svg"
          viewBox="0 0 800 600"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <g data-part="splash-core" transform="translate(400, 300)">
            <path
              d="M-120 -35 C-145 -85, -80 -135, -20 -110 C15 -155, 95 -135, 105 -75 C165 -65, 175 15, 120 45 C140 105, 70 150, 15 115 C-35 160, -115 130, -105 65 C-165 55, -170 -15, -120 -35 Z"
              fill="url(#waterGrad)"
            />
            <circle cx="-135" cy="-95" r="13" fill="#fef08a" />
            <circle cx="155" cy="-85" r="10" fill="#fde047" />
            <circle cx="165" cy="70" r="15" fill="#fef08a" />
            <circle cx="-145" cy="95" r="11" fill="#ffffff" opacity="0.75" />
            <circle cx="25" cy="-155" r="8" fill="#ffffff" opacity="0.85" />
            <circle cx="-35" cy="152" r="9" fill="#fde047" />
          </g>

          <defs>
            <linearGradient
              id="waterGrad"
              x1="180"
              y1="200"
              x2="600"
              y2="420"
              gradientUnits="userSpaceOnUse"
            >
              <stop offset="0%" stopColor="#fef9c3" />
              <stop offset="55%" stopColor="#fde047" />
              <stop offset="100%" stopColor="#facc15" />
            </linearGradient>
          </defs>
        </svg>

        {/* Character Santri matching reference style */}
        <svg
          className="kid-svg"
          data-part="kid-root"
          viewBox="0 0 260 280"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          {/* Subtle ground shadow */}
          <ellipse
            data-part="kid-shadow"
            cx="110"
            cy="252"
            rx="46"
            ry="8"
            fill="rgba(120, 88, 0, 0.22)"
          />

          <g data-part="kid-body-group">
            {/* Back leg (left leg behind) */}
            <g data-part="leg-back">
              {/* Calf */}
              <path
                d="M84 196 L74 224 L88 228 L98 198 Z"
                fill="#f3c6a5"
                stroke="#18181b"
                strokeWidth="3.5"
                strokeLinejoin="round"
              />
              {/* White sock */}
              <path
                d="M74 220 L70 234 L86 238 L89 224 Z"
                fill="#f8fafc"
                stroke="#18181b"
                strokeWidth="3.5"
                strokeLinejoin="round"
              />
              {/* Black shoe */}
              <path
                d="M66 232 C61 232, 57 238, 60 244 C64 249, 86 250, 91 245 C93 241, 88 234, 82 234 Z"
                fill="#1e2024"
                stroke="#18181b"
                strokeWidth="3.5"
                strokeLinejoin="round"
              />
            </g>

            {/* Front leg (right leg forward) */}
            <g data-part="leg-front">
              {/* Calf */}
              <path
                d="M110 198 L114 224 L128 222 L124 196 Z"
                fill="#f3c6a5"
                stroke="#18181b"
                strokeWidth="3.5"
                strokeLinejoin="round"
              />
              {/* White sock */}
              <path
                d="M113 221 L115 235 L131 233 L129 219 Z"
                fill="#f8fafc"
                stroke="#18181b"
                strokeWidth="3.5"
                strokeLinejoin="round"
              />
              {/* Black shoe */}
              <path
                d="M113 233 C112 239, 114 245, 120 245 L139 243 C145 242, 146 234, 139 231 C134 230, 122 232, 113 233 Z"
                fill="#1e2024"
                stroke="#18181b"
                strokeWidth="3.5"
                strokeLinejoin="round"
              />
            </g>

            {/* Back arm (reaching to bucket handle) */}
            <g data-part="arm-back">
              <path
                d="M126 144 C140 144, 152 140, 158 134"
                stroke="#18181b"
                strokeWidth="15"
                strokeLinecap="round"
              />
              <path
                d="M126 144 C140 144, 152 140, 158 134"
                stroke="#e9b996"
                strokeWidth="9"
                strokeLinecap="round"
              />
            </g>

            {/* Sarung Santri Motif Hitam Kotak-kotak */}
            <path
              d="M82 174 L132 174 L138 212 L76 212 Z"
              fill="#27272a"
              stroke="#18181b"
              strokeWidth="3.5"
              strokeLinejoin="round"
            />
            {/* Garis-garis kotak sarung */}
            <line x1="94" y1="174" x2="94" y2="212" stroke="#52525b" strokeWidth="2.2" />
            <line x1="110" y1="174" x2="110" y2="212" stroke="#52525b" strokeWidth="2.2" />
            <line x1="124" y1="174" x2="124" y2="212" stroke="#52525b" strokeWidth="2.2" />
            <line x1="80" y1="188" x2="134" y2="188" stroke="#52525b" strokeWidth="2" />
            <line x1="77" y1="202" x2="136" y2="202" stroke="#52525b" strokeWidth="2" />

            {/* Crisp White Collared Shirt */}
            <path
              d="M90 124 L126 126 L133 176 L83 176 Z"
              fill="#f8fafc"
              stroke="#18181b"
              strokeWidth="3.5"
              strokeLinejoin="round"
            />
            {/* Shirt collar */}
            <path
              d="M96 121 L118 125 L110 133 Z"
              fill="#e2e8f0"
              stroke="#18181b"
              strokeWidth="3"
              strokeLinejoin="round"
            />

            {/* Head */}
            <g data-part="kid-head">
              {/* Face */}
              <path
                d="M78 76 C76 52, 98 42, 122 48 C142 53, 148 72, 146 86 C149 90, 152 94, 147 98 C146 108, 138 118, 122 121 C104 124, 82 114, 78 96 Z"
                fill="#f3c6a5"
                stroke="#18181b"
                strokeWidth="3.5"
                strokeLinejoin="round"
              />

              {/* Rambut dengan jambul mengarah ke atas khas karakter */}
              <path
                d="M78 96 C70 84, 70 62, 82 48 C79 44, 80 41, 86 43 C96 34, 122 33, 136 42 C142 39, 147 35, 148 31 C152 38, 148 52, 136 56 C122 60, 108 58, 102 68 C100 76, 98 86, 90 92 C86 95, 81 97, 78 96 Z"
                fill="#232326"
                stroke="#18181b"
                strokeWidth="3.5"
                strokeLinejoin="round"
              />

              {/* Ear */}
              <path
                d="M93 84 C86 82, 83 94, 91 98 C95 100, 98 96, 98 92"
                fill="#f3c6a5"
                stroke="#18181b"
                strokeWidth="3.2"
                strokeLinecap="round"
              />
              <path
                d="M91 89 C89 90, 89 93, 92 94"
                stroke="#18181b"
                strokeWidth="2.5"
                strokeLinecap="round"
              />
              {/* Eyebrow */}
              <path
                d="M126 70 Q132 67 137 70"
                stroke="#18181b"
                strokeWidth="2.8"
                strokeLinecap="round"
              />
              {/* Eye */}
              <circle cx="132" cy="80" r="3.4" fill="#18181b" />
              {/* Gentle smile */}
              <path
                d="M137 104 Q143 105 146 101"
                stroke="#18181b"
                strokeWidth="2.8"
                strokeLinecap="round"
              />
            </g>

            {/* Front arm + Slate-Gray Bucket */}
            <g data-part="arm-front">
              {/* Short sleeve */}
              <path
                d="M108 130 L124 134 L120 152 L103 148 Z"
                fill="#f8fafc"
                stroke="#18181b"
                strokeWidth="3.5"
                strokeLinejoin="round"
              />
              {/* Forearm */}
              <path
                d="M114 148 C126 154, 142 152, 152 142"
                stroke="#18181b"
                strokeWidth="15"
                strokeLinecap="round"
              />
              <path
                d="M114 148 C126 154, 142 152, 152 142"
                stroke="#f3c6a5"
                strokeWidth="9"
                strokeLinecap="round"
              />
              {/* Hand gripping bucket handle */}
              <circle
                cx="154"
                cy="141"
                r="7.5"
                fill="#f3c6a5"
                stroke="#18181b"
                strokeWidth="3.2"
              />

              {/* Slate-Gray Bucket */}
              <g data-part="bucket" transform="translate(132, 134)">
                {/* Handle */}
                <path
                  d="M14 22 C14 2, 42 2, 42 22"
                  stroke="#18181b"
                  strokeWidth="6.5"
                  strokeLinecap="round"
                  fill="none"
                />
                <path
                  d="M14 22 C14 2, 42 2, 42 22"
                  stroke="#374151"
                  strokeWidth="2.5"
                  strokeLinecap="round"
                  fill="none"
                />
                {/* Bucket body */}
                <path
                  d="M6 22 L52 22 L46 66 C45 70, 13 70, 12 66 Z"
                  fill="#4b5563"
                  stroke="#18181b"
                  strokeWidth="3.5"
                  strokeLinejoin="round"
                />
                {/* Bucket rim */}
                <ellipse
                  cx="29"
                  cy="22"
                  rx="24"
                  ry="5.5"
                  fill="#374151"
                  stroke="#18181b"
                  strokeWidth="3.5"
                />
                {/* Water/liquid inside rim */}
                <ellipse cx="29" cy="22" rx="18" ry="3" fill="#fef08a" opacity="0.9" />
              </g>
            </g>
          </g>
        </svg>
      </div>
    );
  }
);

PainterKidScene.displayName = 'PainterKidScene';

