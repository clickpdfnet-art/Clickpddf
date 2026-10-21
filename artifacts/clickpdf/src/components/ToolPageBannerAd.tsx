import React, { useEffect, useId, useMemo, useRef, useState } from 'react';

const CONSENT_KEY = 'clickpdf_cookie_consent_v1';
const AD_CHANNEL = 'clickpdf-bauval-banner';
const PROVIDER_SCRIPT_URL = 'https://bauval.org/22/3221c27a7eae6feed96313cf6813cfcc';
const BANNER_WIDTH = 320;
const BANNER_HEIGHT = 50;
const FILL_TIMEOUT_MS = 10_000;

type AdState = 'consent-required' | 'loading' | 'rendered' | 'empty';

function createProviderFrameDocument(nonce: string): string {
  const nonceLiteral = JSON.stringify(nonce);
  const channelLiteral = JSON.stringify(AD_CHANNEL);
  const scriptUrlLiteral = JSON.stringify(PROVIDER_SCRIPT_URL);

  return `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="referrer" content="no-referrer">
  <meta name="viewport" content="width=320, initial-scale=1">
  <style>html,body{width:320px;height:50px;margin:0;padding:0;overflow:hidden;background:transparent}</style>
  <script>
  (() => {
    const channel = ${channelLiteral};
    const nonce = ${nonceLiteral};
    const send = state => parent.postMessage({ channel, nonce, state }, '*');
    const observed = new WeakSet();

    const hasVisibleCreative = frame => {
      try {
        const doc = frame.contentDocument;
        if (!doc || !doc.body || doc.readyState !== 'complete') return false;
        const nodes = doc.querySelectorAll('img,video,canvas,svg,object,embed,a,[role="img"],[data-ad]');
        for (const node of nodes) {
          const rect = node.getBoundingClientRect();
          const style = doc.defaultView.getComputedStyle(node);
          if (rect.width < 2 || rect.height < 2 || style.display === 'none' || style.visibility === 'hidden' || Number(style.opacity) === 0) continue;
          if (node instanceof doc.defaultView.HTMLImageElement && node.complete && node.naturalWidth > 1 && node.naturalHeight > 1) return true;
          if (node instanceof doc.defaultView.HTMLVideoElement && node.readyState >= 1) return true;
          if (node instanceof doc.defaultView.HTMLCanvasElement && node.width > 1 && node.height > 1) {
            try {
              const pixels = node.getContext('2d')?.getImageData(0, 0, node.width, node.height).data;
              if (pixels && pixels.some((value, index) => index % 4 === 3 && value > 0)) return true;
            } catch {}
          }
          if (node instanceof doc.defaultView.SVGElement && node.childElementCount > 0) return true;
          if (node instanceof doc.defaultView.HTMLObjectElement || node instanceof doc.defaultView.HTMLEmbedElement) return true;
          if (node instanceof doc.defaultView.HTMLAnchorElement && node.textContent.trim()) return true;
        }
        return false;
      } catch {
        // A cross-origin creative cannot be inspected safely from this sandbox.
        return false;
      }
    };

    const observeFrame = frame => {
      if (!(frame instanceof HTMLIFrameElement) || observed.has(frame)) return;
      observed.add(frame);
      const inspect = () => {
        const rect = frame.getBoundingClientRect();
        const width = Number(frame.getAttribute('width')) || rect.width;
        const height = Number(frame.getAttribute('height')) || rect.height;
        if (width < 320 || height < 50 || !frame.src || frame.src === 'about:blank') return;
        if (hasVisibleCreative(frame)) send('rendered');
        else send('unverifiable');
      };
      frame.addEventListener('load', inspect);
      if (frame.contentDocument?.readyState === 'complete') inspect();
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
  const [consentAccepted, setConsentAccepted] = useState(false);
  const [state, setState] = useState<AdState>('consent-required');
  const [scale, setScale] = useState(1);
  const srcDoc = useMemo(() => createProviderFrameDocument(nonce), [nonce]);
  const scaledWidth = Math.round(BANNER_WIDTH * scale);
  const scaledHeight = Math.round(BANNER_HEIGHT * scale);

  useEffect(() => {
    const readConsent = () => {
      try {
        setConsentAccepted(window.localStorage.getItem(CONSENT_KEY) === 'accepted');
      } catch {
        setConsentAccepted(false);
      }
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
    if (!consentAccepted) {
      setState('consent-required');
      return;
    }

    setState('loading');
    const timeout = window.setTimeout(() => setState(current => current === 'loading' ? 'empty' : current), FILL_TIMEOUT_MS + 1_000);
    const onMessage = (event: MessageEvent) => {
      if (event.source !== frameRef.current?.contentWindow) return;
      const message = event.data;
      if (!message || message.channel !== AD_CHANNEL || message.nonce !== nonce) return;
      if (message.state === 'rendered') setState('rendered');
      else if (message.state === 'empty' || message.state === 'unverifiable') {
        setState(current => current === 'rendered' ? current : 'empty');
      }
    };

    window.addEventListener('message', onMessage);
    return () => {
      window.clearTimeout(timeout);
      window.removeEventListener('message', onMessage);
    };
  }, [consentAccepted, nonce]);

  const rendered = state === 'rendered';
  const frameActive = consentAccepted && (state === 'loading' || rendered);

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
            referrerPolicy="no-referrer"
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
