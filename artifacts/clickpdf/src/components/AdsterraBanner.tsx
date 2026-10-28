import React, { useState } from 'react';

interface AdsterraBannerProps {
  className?: string;
}

export const AdsterraBanner: React.FC<AdsterraBannerProps> = ({ className = '' }) => {
  const [hasError, setHasError] = useState(false);

  if (hasError) {
    return null;
  }

  return (
    <div
      className={`w-full flex items-center justify-center my-2 sm:my-3 ${className}`}
      aria-label="Advertisement"
    >
      <div className="relative w-[320px] h-[50px] max-w-full overflow-hidden flex items-center justify-center bg-transparent">
        <iframe
          src="/ad-320x50.html"
          title="Advertisement"
          width="320"
          height="50"
          scrolling="no"
          onError={() => setHasError(true)}
          className="border-0 overflow-hidden bg-transparent w-[320px] h-[50px]"
          style={{ border: 'none', background: 'transparent' }}
        />
      </div>
    </div>
  );
};
