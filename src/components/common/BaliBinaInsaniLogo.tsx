import React from 'react';

export function BaliBinaInsaniLogo({
  size = 95,
  customLogoUrl = ''
}: {
  size?: number;
  customLogoUrl?: string;
}) {
  const logoSrc = customLogoUrl || '/logo-bbi.png';

  return (
    <img
      src={logoSrc}
      alt="Logo Pondok Pesantren Bali Bina Insani"
      style={{ width: size, height: size }}
      className="object-contain select-none"
    />
  );
}
