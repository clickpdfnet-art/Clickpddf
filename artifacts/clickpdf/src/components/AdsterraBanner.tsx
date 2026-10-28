import React, { useEffect, useRef, useState } from 'react';

const BANNER_WIDTH = 320;
const BANNER_HEIGHT = 50;
const COOKIE_CONSENT_KEY = 'clickpdf_cookie_consent_v1';
const CONSENT_CHANGED_EVENT = 'clickpdf-cookie-consent-change';

interface AdsterraBannerProps {
  className?: string;
}

function getAdsAllowed(): boolean {
  try {
    return localStorage.getItem(COOKIE_CONSENT_KEY) !== 'rejected';
  } catch {
    return true;
  }
}

export const AdsterraBanner: React.FC<AdsterraBannerProps> = ({ className = '' }) => {
  const [scale, setScale] = useState(1);
  const [adsAllowed, setAdsAllowed] = useState(getAdsAllowed);
  const adsAllowedRef = useRef(adsAllowed);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleConsentChange = () => {
      const allowed = getAdsAllowed();
      if (adsAllowedRef.current === allowed) return;
      adsAllowedRef.current = allowed;
      setAdsAllowed(allowed);
    };
    window.addEventListener(CONSENT_CHANGED_EVENT, handleConsentChange);
    window.addEventListener('storage', handleConsentChange);
    return () => {
      window.removeEventListener(CONSENT_CHANGED_EVENT, handleConsentChange);
      window.removeEventListener('storage', handleConsentChange);
    };
  }, []);

  useEffect(() => {
    const updateScale = () => {
      const padding = 24;
      const viewportWidth = window.innerWidth - padding;
      const containerWidth = containerRef.current?.parentElement?.clientWidth ?? viewportWidth;
      const availableWidth = Math.min(viewportWidth, containerWidth);
      setScale(Math.min(1, Math.max(0, availableWidth / BANNER_WIDTH)));
    };
    updateScale();
    window.addEventListener('resize', updateScale);
    const resizeObserver = typeof ResizeObserver === 'undefined'
      ? null
      : new ResizeObserver(updateScale);
    if (containerRef.current?.parentElement) {
      resizeObserver?.observe(containerRef.current.parentElement);
    }
    return () => {
      window.removeEventListener('resize', updateScale);
      resizeObserver?.disconnect();
    };
  }, []);

  const scaledWidth = Math.round(BANNER_WIDTH * scale);
  const scaledHeight = Math.round(BANNER_HEIGHT * scale);

  return (
    <div
      ref={containerRef}
      className={className}
      data-testid="tool-page-banner-ad"
      data-slot-state={adsAllowed ? 'visible' : 'consent-blocked'}
      style={{
        display: adsAllowed ? 'flex' : 'none',
        justifyContent: 'center',
        alignItems: 'center',
        width: adsAllowed ? scaledWidth : 0,
        maxWidth: 'calc(100vw - 24px)',
        height: adsAllowed ? scaledHeight : 0,
        marginTop: adsAllowed ? undefined : 0,
        marginBottom: adsAllowed ? undefined : 0,
        marginLeft: 'auto',
        marginRight: 'auto',
        padding: 0,
        border: 0,
        overflow: 'hidden',
      }}
    >
      {adsAllowed && (
        <iframe
          title="Advertisement"
          src="/ad-320x50.html"
          sandbox="allow-scripts allow-popups allow-popups-to-escape-sandbox allow-forms"
          referrerPolicy="strict-origin-when-cross-origin"
          width={BANNER_WIDTH}
          height={BANNER_HEIGHT}
          scrolling="no"
          style={{
            display: 'block',
            width: BANNER_WIDTH,
            height: BANNER_HEIGHT,
            border: 0,
            margin: 0,
            padding: 0,
            transform: scale < 1 ? `scale(${scale})` : undefined,
            transformOrigin: 'top left',
          }}
        />
      )}
    </div>
  );
};
