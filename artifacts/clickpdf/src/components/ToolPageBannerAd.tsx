import React, { useEffect, useId, useMemo, useRef, useState } from 'react';

const CONSENT_KEY = 'clickpdf_cookie_consent_v1';
const AD_CHANNEL = 'clickpdf-bauval-banner';
const PROVIDER_SCRIPT_URL = 'https://bauval.org/22/3221c27a7eae6feed96313cf6813cfcc';
const BANNER_WIDTH = 320;
const BANNER_HEIGHT = 50;
const FILL_TIMEOUT_MS = 10_000;

type AdState = 'loading' | 'rendered' | 'empty';

function hasExplicitAdOptOut(): boolean {
  if (typeof window === 'undefined') return false;
  try {
    return window.localStorage.getItem(CONSENT_KEY) === 'rejected';
  } catch {
    // The banner defaults to enabled when browser storage is unavailable.
    return false;
  }
}

function createProviderFrameDocument(nonce: string): string {
  const nonceLiteral = JSON.stringify(nonce);
  const channelLiteral = JSON.stringify(AD_CHANNEL);
  const scriptUrlLiteral = JSON.stringify(PROVIDER_SCRIPT_URL);

  return `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="referrer" content="strict-origin">
  <meta name="viewport" content="width=320, initial-scale=1">
  <style>html,body{width:320px;height:50px;margin:0;padding:0;overflow:hidden;background:transparent}</style>
  <script>
  (() => {
    const channel = ${channelLiteral};
    const nonce = ${nonceLiteral};
    const send = state => parent.postMessage({ channel, nonce, state }, '*');
    const observed = new WeakSet();
    let providerFrameLoaded = false;

    window.addEventListener('message', event => {
      const message = event.data;
      if (event.source !== parent || !message || message.channel !== channel || message.nonce !== nonce || message.state !== 'ready') return;
      if (providerFrameLoaded) send('loaded');
    });

    const observeFrame = frame => {
      if (!(frame instanceof HTMLIFrameElement) || observed.has(frame)) return;
      observed.add(frame);
      const onLoad = () => {
        const rect = frame.getBoundingClientRect();
        const width = Number(frame.getAttribute('width')) || rect.width;
        const height = Number(frame.getAttribute('height')) || rect.height;
        if (width < 320 || height < 50 || !frame.src || frame.src === 'about:blank') return;
        providerFrameLoaded = true;
        send('loaded');
      };
      frame.addEventListener('load', onLoad);
      if (frame.contentDocument?.readyState === 'complete' && frame.src && frame.src !== 'about:blank') onLoad();
    };

    const scan = node => {
      if (node instanceof HTMLIFrameElement) observeFrame(node);
      if (node.querySelectorAll) node.querySelectorAll('iframe').forEach(observeFrame);
    };

    const observer = new MutationObserver(records => {
      for (const record of records) record.addedNodes.forEach(scan);
    });
    observer.observe(document.documentElement, { childList: true, subtree: true });
    window.addEventListener('pagehide', () => observer.disconnect(), { once: true });
    window.addEventListener('error', event => {
      if (event.target instanceof HTMLScriptElement && event.target.src === ${scriptUrlLiteral}) send('empty');
    }, true);
    window.setTimeout(() => send('empty'), ${FILL_TIMEOUT_MS});
  })();
  </script>
</head>
<body>
  <script>
    atOptions = {
      'key' : '3221c27a7eae6feed96313cf6813cfcc',
      'format' : 'iframe',
      'height' : 50,
      'width' : 320,
      'params' : {}
    };
  </script>
  <script src="https://bauval.org/22/3221c27a7eae6feed96313cf6813cfcc"></script>
</body>
</html>`;
}

export const ToolPageBannerAd: React.FC = () => {
  const frameRef = useRef<HTMLIFrameElement>(null);
  const id = useId();
  const nonce = useMemo(() => `clickpdf-ad-${id}`, [id]);
  const [adEnabled, setAdEnabled] = useState(() => !hasExplicitAdOptOut());
  const [state, setState] = useState<AdState>(() => hasExplicitAdOptOut() ? 'empty' : 'loading');
  const [scale, setScale] = useState(1);
  const srcDoc = useMemo(() => createProviderFrameDocument(nonce), [nonce]);
  const scaledWidth = Math.round(BANNER_WIDTH * scale);
  const scaledHeight = Math.round(BANNER_HEIGHT * scale);

  useEffect(() => {
    const readConsent = () => {
      setAdEnabled(!hasExplicitAdOptOut());
    };
    readConsent();
    window.addEventListener('storage', readConsent);
    window.addEventListener('clickpdf-cookie-consent-change', readConsent);
    return () => {
      window.removeEventListener('storage', readConsent);
      window.removeEventListener('clickpdf-cookie-consent-change', readConsent);
    };
  }, []);

  useEffect(() => {
    const updateScale = () => setScale(Math.min(1, Math.max(0.1, window.innerWidth / BANNER_WIDTH)));
    updateScale();
    window.addEventListener('resize', updateScale);
    return () => window.removeEventListener('resize', updateScale);
  }, []);

  useEffect(() => {
    if (!adEnabled) {
      setState('empty');
      return;
    }

    setState('loading');
    const timeout = window.setTimeout(() => setState(current => current === 'loading' ? 'empty' : current), FILL_TIMEOUT_MS + 1_000);
    const onMessage = (event: MessageEvent) => {
      if (event.source !== frameRef.current?.contentWindow) return;
      const message = event.data;
      if (!message || message.channel !== AD_CHANNEL || message.nonce !== nonce) return;
      if (message.state === 'loaded') setState('rendered');
      else if (message.state === 'empty') setState(current => current === 'rendered' ? current : 'empty');
    };

    window.addEventListener('message', onMessage);
    frameRef.current?.contentWindow?.postMessage({ channel: AD_CHANNEL, nonce, state: 'ready' }, '*');
    return () => {
      window.clearTimeout(timeout);
      window.removeEventListener('message', onMessage);
    };
  }, [adEnabled, nonce]);

  const rendered = state === 'rendered';
  const frameActive = adEnabled && (state === 'loading' || rendered);

  return (
    <div
      data-testid="tool-page-banner-ad"
      data-ad-state={state}
      aria-hidden={!rendered}
      style={rendered
        ? { display: 'flex', justifyContent: 'center', alignItems: 'flex-start', width: '100%', height: scaledHeight, margin: 0, padding: 0, border: 0, overflow: 'hidden' }
        : { display: 'none', width: 0, height: 0, margin: 0, padding: 0, border: 0, overflow: 'hidden' }}
    >
      {frameActive && (
        <div style={{ position: 'relative', width: scaledWidth, height: scaledHeight, flex: '0 0 auto', overflow: 'hidden' }}>
          <iframe
            ref={frameRef}
            title="Advertisement"
            srcDoc={srcDoc}
            sandbox="allow-scripts allow-popups allow-popups-to-escape-sandbox"
            referrerPolicy="strict-origin"
            width={BANNER_WIDTH}
            height={BANNER_HEIGHT}
            scrolling="no"
            style={{
              position: 'absolute',
              top: 0,
              left: 0,
              display: 'block',
              width: BANNER_WIDTH,
              height: BANNER_HEIGHT,
              maxWidth: 'none',
              border: 0,
              margin: 0,
              padding: 0,
              transform: `scale(${scale})`,
              transformOrigin: 'top left',
            }}
          />
        </div>
      )}
    </div>
  );
};
