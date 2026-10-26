import React, { useEffect, useMemo, useRef, useState } from 'react';

const BANNER_WIDTH = 320;
const BANNER_HEIGHT = 50;
const FRAME_SIGNAL_TIMEOUT_MS = 12_000;
const COOKIE_CONSENT_KEY = 'clickpdf_cookie_consent_v1';
const CONSENT_CHANGED_EVENT = 'clickpdf-cookie-consent-change';
const SIGNAL_CHANNEL = 'clickpdf-bauval-banner';

interface AdsterraBannerProps {
  className?: string;
}

function getSignalNonce(): string {
  try {
    if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
      return crypto.randomUUID();
    }
  } catch {
    // Continue with a non-cryptographic nonce; it is only a message correlation value.
  }
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2)}`;
}

function getAdsAllowed(): boolean {
  try {
    return localStorage.getItem(COOKIE_CONSENT_KEY) !== 'rejected';
  } catch {
    return true;
  }
}

export const AdsterraBanner: React.FC<AdsterraBannerProps> = ({ className = '' }) => {
  const frameRef = useRef<HTMLIFrameElement>(null);
  const [scale, setScale] = useState(1);
  const [adsAllowed, setAdsAllowed] = useState(getAdsAllowed);
  const [adState, setAdState] = useState<'loading' | 'rendered' | 'empty'>(() =>
    getAdsAllowed() ? 'loading' : 'empty',
  );
  const adsAllowedRef = useRef(adsAllowed);
  const nonce = useMemo(getSignalNonce, []);
  const frameSrc = useMemo(
    () => `/ad-320x50.html#${encodeURIComponent(nonce)}`,
    [nonce],
  );

  useEffect(() => {
    const handleConsentChange = () => {
      const allowed = getAdsAllowed();
      if (adsAllowedRef.current === allowed) return;
      adsAllowedRef.current = allowed;
      setAdsAllowed(allowed);
      setAdState(allowed ? 'loading' : 'empty');
    };
    window.addEventListener(CONSENT_CHANGED_EVENT, handleConsentChange);
    window.addEventListener('storage', handleConsentChange);
    return () => {
      window.removeEventListener(CONSENT_CHANGED_EVENT, handleConsentChange);
      window.removeEventListener('storage', handleConsentChange);
    };
  }, []);

  useEffect(() => {
    if (!adsAllowed || adState !== 'loading') return;

    const timeoutId = window.setTimeout(() => setAdState('empty'), FRAME_SIGNAL_TIMEOUT_MS);
    const handleProviderMessage = (event: MessageEvent) => {
      if (event.source !== frameRef.current?.contentWindow) return;
      if (event.data?.channel !== SIGNAL_CHANNEL || event.data?.nonce !== nonce) return;

      if (event.data.state === 'rendered') {
        window.clearTimeout(timeoutId);
        setAdState('rendered');
      } else if (event.data.state === 'empty') {
        window.clearTimeout(timeoutId);
        setAdState('empty');
      }
    };

    window.addEventListener('message', handleProviderMessage);
    return () => {
      window.clearTimeout(timeoutId);
      window.removeEventListener('message', handleProviderMessage);
    };
  }, [adsAllowed, adState, nonce]);

  // Responsive scaling for mobile devices
  useEffect(() => {
    const updateScale = () => {
      const padding = 24;
      const availableWidth = window.innerWidth - padding;
      setScale(Math.min(1, Math.max(0.7, availableWidth / BANNER_WIDTH)));
    };
    updateScale();
    window.addEventListener('resize', updateScale);
    return () => window.removeEventListener('resize', updateScale);
  }, []);

  const scaledWidth = Math.round(BANNER_WIDTH * scale);
  const scaledHeight = Math.round(BANNER_HEIGHT * scale);
  const isSlotVisible = adsAllowed && adState !== 'empty';

  return (
    <div
      className={className}
      data-testid="tool-page-banner-ad"
      data-ad-state={adsAllowed ? adState : 'empty'}
      style={{
        display: isSlotVisible ? 'flex' : 'none',
        justifyContent: 'center',
        alignItems: 'center',
        width: isSlotVisible ? scaledWidth : 0,
        height: isSlotVisible ? scaledHeight : 0,
        marginTop: isSlotVisible ? undefined : 0,
        marginBottom: isSlotVisible ? undefined : 0,
        marginLeft: 'auto',
        marginRight: 'auto',
        padding: 0,
        border: 0,
        overflow: 'hidden',
      }}
    >
      {adsAllowed && adState !== 'empty' && (
        <iframe
          ref={frameRef}
          title="Advertisement"
          src={frameSrc}
          sandbox="allow-scripts allow-popups allow-popups-to-escape-sandbox allow-forms"
          referrerPolicy="strict-origin"
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
