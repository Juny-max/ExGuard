import React from 'react';

interface ExpiryGuardLogoProps {
  className?: string;
  alt?: string;
  variant?: string;
}

export const ExpiryGuardLogo: React.FC<ExpiryGuardLogoProps> = ({
  className = 'w-8 h-8',
  alt = 'ExpiryGuard Logo',
}) => {
  return (
    <img
      src="/ExpiryGuard.jpg"
      alt={alt}
      className={`${className} object-contain shrink-0 rounded-lg`}
      referrerPolicy="no-referrer"
    />
  );
};


