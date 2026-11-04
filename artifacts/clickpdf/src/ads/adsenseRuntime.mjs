export const ADSENSE_PUBLISHER_ID = 'ca-pub-625034426022238';

export const ADSENSE_SLOT_IDS = Object.freeze({
  toolHeader: 'REPLACE_WITH_TOOL_HEADER_AD_SLOT_ID',
  beforeBack: 'REPLACE_WITH_TOOL_BEFORE_BACK_AD_SLOT_ID',
});

export const ADVERTISING_CONSENT_STORAGE_KEY = 'clickpdf_cookie_consent_v1';
export const ADVERTISING_CONSENT_CHANGED_EVENT = 'clickpdf-cookie-consent-change';
export const ADSENSE_SCRIPT_URL = 'https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js';

export function isValidAdSensePublisherId(publisherId) {
  return typeof publisherId === 'string' && /^ca-pub-\d{12,20}$/.test(publisherId);
}

export function isValidAdSenseSlotId(slotId) {
  return typeof slotId === 'string' && /^\d{6,20}$/.test(slotId);
}

export function hasConfiguredAdSenseSlots(slotIds) {
  return Boolean(
    slotIds &&
    isValidAdSenseSlotId(slotIds.toolHeader) &&
    isValidAdSenseSlotId(slotIds.beforeBack),
  );
}

export function shouldLoadAdSense(publisherId, slotIds, consentState) {
  return isValidAdSensePublisherId(publisherId) &&
    hasConfiguredAdSenseSlots(slotIds) &&
    consentState !== 'rejected';
}

let scriptLoadPromise = null;

export function loadAdSenseScriptOnce(documentRef, publisherId = ADSENSE_PUBLISHER_ID) {
  if (!isValidAdSensePublisherId(publisherId)) {
    return Promise.reject(new Error('A valid AdSense publisher ID is required.'));
  }
  if (scriptLoadPromise) return scriptLoadPromise;

  const existingScript = documentRef.querySelector('script[data-clickpdf-adsense="true"]');
  if (existingScript) {
    scriptLoadPromise = Promise.resolve();
    return scriptLoadPromise;
  }

  const script = documentRef.createElement('script');
  script.async = true;
  script.crossOrigin = 'anonymous';
  script.src = `${ADSENSE_SCRIPT_URL}?client=${encodeURIComponent(publisherId)}`;
  script.setAttribute('data-clickpdf-adsense', 'true');

  scriptLoadPromise = new Promise((resolve, reject) => {
    script.addEventListener('load', resolve, { once: true });
    script.addEventListener('error', () => {
      scriptLoadPromise = null;
      reject(new Error('The official AdSense script failed to load.'));
    }, { once: true });
  });
  documentRef.head.appendChild(script);
  return scriptLoadPromise;
}
