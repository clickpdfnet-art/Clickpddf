import React, { useEffect, useRef, useState } from 'react';

interface AdsterraBannerProps {
  className?: string;
}

export const AdsterraBanner: React.FC<AdsterraBannerProps> = ({ className = '' }) => {
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const [isLoaded, setIsLoaded] = useState(false);
  const [hasFailed, setHasFailed] = useState(false);

  useEffect(() => {
    setIsLoaded(false);
    setHasFailed(false);

    const iframe = iframeRef.current;
    if (!iframe) return;

    // Listen for postMessage from the isolated iframe
    const handleMessage = (event: MessageEvent) => {
      if (event.data && event.data.type === 'adsterra-status') {
        if (event.data.status === 'loaded') {
          setIsLoaded(true);
        } else {
          setHasFailed(true);
        }
      }
    };

    window.addEventListener('message', handleMessage);

    // Isolated HTML document running Adsterra with real-time delivery detection
    const adHtml = `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <base target="_blank">
  <meta name="referrer" content="no-referrer-when-downgrade">
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    html, body {
      background: transparent;
      width: 100%;
      height: 100%;
      overflow: hidden;
      display: flex;
      justify-content: center;
      align-items: center;
    }
    iframe {
      border: none !important;
      outline: none !important;
    }
  </style>
</head>
<body>
  <div id="ad-wrapper" style="width:320px;height:50px;overflow:hidden;display:flex;align-items:center;justify-content:center;"></div>
  <script type="text/javascript">
    function notify(status) {
      try {
        window.parent.postMessage({ type: 'adsterra-status', status: status }, '*');
      } catch (err) {}
    }

    window.atOptions = {
      'key' : '3221c27a7eae6feed96313cf6813cfcc',
      'format' : 'iframe',
      'height' : 50,
      'width' : 320,
      'params' : {}
    };

    var script = document.createElement('script');
    script.type = 'text/javascript';
    script.src = 'https://bauval.org/22/3221c27a7eae6feed96313cf6813cfcc';
    script.referrerPolicy = 'no-referrer-when-downgrade';
    script.onload = function() {
      setTimeout(function() {
        var iframes = document.getElementsByTagName('iframe');
        if (iframes.length > 0 || (document.body && document.body.innerText.trim().length > 0)) {
          notify('loaded');
        } else {
          notify('empty');
        }
      }, 700);
    };
    script.onerror = function() {
      notify('error');
    };
    document.body.appendChild(script);
  </script>
</body>
</html>`;

    try {
      iframe.srcdoc = adHtml;
    } catch {
      try {
        const doc = iframe.contentDocument || iframe.contentWindow?.document;
        if (doc) {
          doc.open();
          doc.write(adHtml);
          doc.close();
        }
      } catch {
        setHasFailed(true);
      }
    }

    const timeoutTimer = setTimeout(() => {
      setIsLoaded((prev) => {
        if (!prev) {
          setHasFailed(true);
        }
        return prev;
      });
    }, 5000);

    return () => {
      window.removeEventListener('message', handleMessage);
      clearTimeout(timeoutTimer);
    };
  }, []);

  if (hasFailed) {
    return null;
  }

  return (
    <div
      className={
        isLoaded
          ? `w-full flex items-center justify-center my-2 sm:my-3 transition-opacity duration-300 ${className}`
          : 'fixed top-0 left-0 w-0 h-0 overflow-hidden opacity-0 pointer-events-none'
      }
      style={isLoaded ? undefined : { width: 0, height: 0, margin: 0, padding: 0 }}
      aria-label="Advertisement"
    >
      <div className="relative w-[320px] h-[50px] max-w-full overflow-hidden flex items-center justify-center bg-transparent">
        <iframe
          ref={iframeRef}
          title="Advertisement"
          width="320"
          height="50"
          scrolling="no"
          sandbox="allow-scripts allow-same-origin allow-popups allow-popups-to-escape-sandbox allow-forms"
          className="border-0 overflow-hidden bg-transparent w-[320px] h-[50px]"
          style={{ border: 'none', background: 'transparent' }}
        />
      </div>
    </div>
  );
};
