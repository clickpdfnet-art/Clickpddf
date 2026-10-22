import React, { useEffect, useMemo, useRef, useState } from 'react';

const BANNER_WIDTH = 320;
const BANNER_HEIGHT = 50;

interface AdsterraBannerProps {
  className?: string;
}

function createProviderFrameDocument(): string {
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
    <script type="text/javascript" src="https://bauval.org/22/3221c27a7eae6feed96313cf6813cfcc"></script>
  </div>
</body>
</html>`;
}

export const AdsterraBanner: React.FC<AdsterraBannerProps> = ({ className = '' }) => {
  const frameRef = useRef<HTMLIFrameElement>(null);
  const [scale, setScale] = useState(1);
  const srcDoc = useMemo(() => createProviderFrameDocument(), []);

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

  return (
    <div
      className={className}
      data-testid="adsterra-banner"
      style={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        width: '100%',
        minHeight: scaledHeight,
        margin: '8px 0',
      }}
    >
      <div
        style={{
          position: 'relative',
          width: scaledWidth,
          height: scaledHeight,
          overflow: 'hidden',
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
        }}
      >
        <iframe
          ref={frameRef}
          title="Advertisement"
          srcDoc={srcDoc}
          sandbox="allow-scripts allow-same-origin allow-popups allow-popups-to-escape-sandbox allow-forms"
          width={BANNER_WIDTH}
          height={BANNER_HEIGHT}
          scrolling="no"
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            width: BANNER_WIDTH,
            height: BANNER_HEIGHT,
            border: 0,
            margin: 0,
            padding: 0,
            transform: scale < 1 ? `scale(${scale})` : undefined,
            transformOrigin: 'top left',
          }}
        />
      </div>
    </div>
  );
};
