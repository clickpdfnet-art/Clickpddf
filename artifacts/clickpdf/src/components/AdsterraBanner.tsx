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

function createProviderFrameDocument(nonce: string): string {
  return `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <base target="_blank">
  <meta name="viewport" content="width=320, initial-scale=1">
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    html, body {
      width: 320px;
      height: 50px;
      margin: 0;
      padding: 0;
      overflow: hidden;
      background: transparent;
      display: flex;
      justify-content: center;
      align-items: center;
    }
    iframe { border: none !important; }
  </style>
</head>
<body>
  <script>
    const nonce = ${JSON.stringify(nonce)};
    const signal = (state) => parent.postMessage({
      channel: '${SIGNAL_CHANNEL}',
      nonce,
      state
    }, '*');
    window.__clickpdfBannerSignal = signal;
    (function watchCreativeFrames() {
      const observedFrames = new WeakSet();
      const scan = () => document.querySelectorAll('iframe').forEach((creativeFrame) => {
        if (observedFrames.has(creativeFrame)) return;
        observedFrames.add(creativeFrame);
        creativeFrame.addEventListener('load', () => {
          if (creativeFrame.getBoundingClientRect().width > 0 &&
              creativeFrame.getBoundingClientRect().height > 0) {
            signal('rendered');
          }
        }, { once: true });
      });
      new MutationObserver(scan).observe(document.documentElement, {
        childList: true,
        subtree: true
      });
      window.addEventListener('load', scan);
      window.setTimeout(scan, 0);
    })();
  </script>
  <div style="width:320px;height:50px;overflow:hidden;display:flex;align-items:center;justify-content:center;">
    <script type="text/javascript">
      atOptions = {
        'key' : '3221c27a7eae6feed96313cf6813cfcc',
        'format' : 'iframe',
        'height' : 50,
        'width' : 320,
        'params' : {}
      };
    </script>
    <script type="text/javascript" src="https://bauval.org/22/3221c27a7eae6feed96313cf6813cfcc" onerror="window.__clickpdfBannerSignal('empty')"></script>
  </div>
</body>
</html>`;
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
  const srcDoc = useMemo(() => createProviderFrameDocument(nonce), [nonce]);

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
  const isRendered = adsAllowed && adState === 'rendered';

  return (
    <div
      className={className}
      data-testid="tool-page-banner-ad"
      data-ad-state={adsAllowed ? adState : 'empty'}
      style={{
        display: isRendered ? 'flex' : 'none',
        justifyContent: 'center',
        alignItems: 'center',
        width: isRendered ? scaledWidth : 0,
        height: isRendered ? scaledHeight : 0,
        margin: isRendered ? undefined : 0,
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
          srcDoc={srcDoc}
          sandbox="allow-scripts allow-popups allow-popups-to-escape-sandbox allow-forms"
          referrerPolicy="no-referrer"
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
