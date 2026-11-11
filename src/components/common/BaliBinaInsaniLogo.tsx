import React from 'react';

export function BaliBinaInsaniLogo({ size = 95, customLogoUrl = '' }: { size?: number; customLogoUrl?: string }) {
  if (customLogoUrl) {
    return (
      <img
        src={customLogoUrl}
        alt="Logo Pondok Pesantren Bali Bina Insani"
        style={{ width: size, height: size }}
        className="object-contain select-none"
      />
    );
  }

  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 240 240"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className="select-none"
    >
      <defs>
        <path id="bbiTopArc" d="M 33,120 A 87,87 0 1,1 207,120" />
        <path id="bbiBottomArc" d="M 212,120 A 92,92 0 1,1 28,120" />
      </defs>

      <circle cx="120" cy="120" r="113" stroke="#009fe3" strokeWidth="4.5" fill="none" />
      <circle cx="120" cy="120" r="105" stroke="#009fe3" strokeWidth="1.8" fill="none" />
      <circle cx="120" cy="120" r="76" stroke="#009fe3" strokeWidth="3.5" fill="none" />

      <circle cx="23" cy="120" r="4" fill="#009fe3" />
      <circle cx="217" cy="120" r="4" fill="#009fe3" />

      <text
        fill="#009fe3"
        fontSize="13.5"
        fontWeight="800"
        letterSpacing="3.8"
        fontFamily="Arial, Helvetica, sans-serif"
      >
        <textPath href="#bbiTopArc" startOffset="50%" textAnchor="middle">
          BALI BINA INSANI
        </textPath>
      </text>

      <text
        fill="#009fe3"
        fontSize="11.5"
        fontWeight="800"
        letterSpacing="2.1"
        fontFamily="Arial, Helvetica, sans-serif"
      >
        <textPath href="#bbiBottomArc" startOffset="50%" textAnchor="middle">
          TOLERANCE BOARDING SCHOOL
        </textPath>
      </text>

      <path
        d="M 120 49 C 103 69, 64 88, 63 119 C 62 138, 76 151, 92 155 C 77 144, 73 128, 76 115 C 80 95, 106 79, 120 63 C 134 79, 160 95, 164 115 C 167 128, 161 144, 146 155 C 164 150, 178 138, 177 119 C 176 88, 137 69, 120 49 Z"
        fill="#009fe3"
      />
      <path
        d="M 120 67 C 107 82, 82 96, 81 118 C 89 102, 108 91, 120 79 C 132 91, 151 102, 159 118 C 158 96, 133 82, 120 67 Z"
        fill="#009fe3"
      />

      <ellipse cx="120" cy="100" rx="5.5" ry="9.5" stroke="#009fe3" strokeWidth="4" fill="none" />
      <path d="M 79 138 L 111 114 L 111 124 L 84 144 Z" fill="#009fe3" />
      <path
        d="M 149 110 C 163 118, 165 137, 151 146 C 139 154, 126 149, 122 141 C 117 150, 102 153, 93 145"
        stroke="#009fe3"
        strokeWidth="6.5"
        strokeLinecap="round"
        strokeLinejoin="round"
        fill="none"
      />
      <path
        d="M 138 117 C 145 125, 145 136, 136 143"
        stroke="#009fe3"
        strokeWidth="5.5"
        strokeLinecap="round"
        fill="none"
      />
      <path
        d="M 164 148 C 164 148, 170 157, 168 163 C 166 167, 161 167, 159 163 C 157 158, 164 148, 164 148 Z"
        fill="#009fe3"
      />
      <path d="M 96 157 L 118 161 L 118 182 L 96 178 Z" fill="#009fe3" />
      <path d="M 144 157 L 122 161 L 122 182 L 144 178 Z" fill="#009fe3" />
      <path
        d="M 93 181 Q 107 185 120 185 Q 133 185 147 181"
        stroke="#009fe3"
        strokeWidth="2.8"
        fill="none"
      />
    </svg>
  );
}

