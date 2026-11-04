import React, { useEffect, useState } from 'react';
import {
  ADVERTISING_CONSENT_CHANGED_EVENT,
  ADVERTISING_CONSENT_STORAGE_KEY,
  ADSENSE_PUBLISHER_ID,
  ADSENSE_SLOT_ID,
  shouldRequestAdUnit,
} from '../ads/adsenseRuntime.mjs';

interface AdSenseDisplayAdProps {
  className?: string;
}

function readAdvertisingConsent(): string | null {
  try {
    return localStorage.getItem(ADVERTISING_CONSENT_STORAGE_KEY);
  } catch {
    return null;
  }
}

export const AdSenseDisplayAd: React.FC<AdSenseDisplayAdProps> = ({ className = '' }) => {
  const [consentState, setConsentState] = useState(readAdvertisingConsent);
  const canRequestAd = shouldRequestAdUnit(ADSENSE_PUBLISHER_ID, ADSENSE_SLOT_ID, consentState);

  useEffect(() => {
    const refreshConsent = () => setConsentState(readAdvertisingConsent());
    window.addEventListener(ADVERTISING_CONSENT_CHANGED_EVENT, refreshConsent);
    window.addEventListener('storage', refreshConsent);
    return () => {
      window.removeEventListener(ADVERTISING_CONSENT_CHANGED_EVENT, refreshConsent);
      window.removeEventListener('storage', refreshConsent);
    };
  }, []);

  useEffect(() => {
    if (!canRequestAd) return;
    const adsWindow = window as Window & { adsbygoogle?: Array<Record<string, never>> };
    adsWindow.adsbygoogle = adsWindow.adsbygoogle || [];
    adsWindow.adsbygoogle.push({});
  }, [canRequestAd]);

  if (!canRequestAd) return null;

  return (
    <div
      className={`mx-auto my-5 flex w-full justify-center overflow-hidden ${className}`}
      data-testid="adsense-display-ad"
      data-ad-placement="toolHeader"
      style={{ width: 'min(320px, calc(100vw - 24px))', maxWidth: 320, height: 50 }}
    >
      <ins
        className="adsbygoogle"
        style={{ display: 'block', width: '100%', height: 50 }}
        data-ad-client={ADSENSE_PUBLISHER_ID}
        data-ad-slot={ADSENSE_SLOT_ID}
        data-ad-format="horizontal"
        data-full-width-responsive="true"
      />
    </div>
  );
};
