import React, { useEffect, useRef, useState } from 'react';
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

const NO_FILL_COLLAPSE_MS = 12_000;

function readAdvertisingConsent(): string | null {
  try {
    return localStorage.getItem(ADVERTISING_CONSENT_STORAGE_KEY);
  } catch {
    return null;
  }
}

export const AdSenseDisplayAd: React.FC<AdSenseDisplayAdProps> = ({ className = '' }) => {
  const [consentState, setConsentState] = useState(readAdvertisingConsent);
  const [adStatus, setAdStatus] = useState<'loading' | 'filled' | 'unfilled'>('loading');
  const adElementRef = useRef<HTMLModElement | null>(null);
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
    if (!canRequestAd) {
      setAdStatus('unfilled');
      return;
    }

    setAdStatus('loading');
    const adElement = adElementRef.current;
    if (!adElement) return;

    const readProviderStatus = () => {
      const providerStatus = adElement.getAttribute('data-ad-status');
      if (providerStatus === 'filled') setAdStatus('filled');
      if (providerStatus === 'unfilled') setAdStatus('unfilled');
    };
    const observer = new MutationObserver(readProviderStatus);
    observer.observe(adElement, { attributes: true, attributeFilter: ['data-ad-status'] });
    readProviderStatus();

    const noFillTimeout = window.setTimeout(() => {
      if (adElement.getAttribute('data-ad-status') !== 'filled') {
        setAdStatus('unfilled');
      }
    }, NO_FILL_COLLAPSE_MS);

    return () => {
      observer.disconnect();
      window.clearTimeout(noFillTimeout);
    };
  }, [canRequestAd]);

  useEffect(() => {
    if (!canRequestAd) return;
    const adsWindow = window as Window & { adsbygoogle?: Array<Record<string, never>> };
    adsWindow.adsbygoogle = adsWindow.adsbygoogle || [];
    adsWindow.adsbygoogle.push({});
  }, [canRequestAd]);

  if (!canRequestAd) return null;

  const isUnfilled = adStatus === 'unfilled';

  return (
    <aside
      aria-label="Advertisement"
      aria-hidden={isUnfilled}
      className={`mx-auto ${isUnfilled ? 'my-0' : 'my-2'} flex w-full shrink-0 justify-center overflow-hidden ${className}`}
      data-testid="adsense-display-ad"
      data-ad-placement="toolHeader"
      data-ad-status={adStatus}
      style={{
        width: 'min(320px, calc(100vw - 24px))',
        maxWidth: 320,
        height: isUnfilled ? 0 : 50,
        minHeight: isUnfilled ? 0 : 50,
        maxHeight: 50,
        flex: isUnfilled ? '0 0 0px' : '0 0 50px',
      }}
    >
      <ins
        className="adsbygoogle"
        style={{ display: 'block', width: '100%', height: 50 }}
        ref={adElementRef}
        data-ad-client={ADSENSE_PUBLISHER_ID}
        data-ad-slot={ADSENSE_SLOT_ID}
        data-ad-format="horizontal"
        data-full-width-responsive="true"
      />
    </aside>
  );
};
