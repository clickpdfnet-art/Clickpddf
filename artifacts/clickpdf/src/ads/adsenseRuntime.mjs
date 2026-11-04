export const ADSENSE_PUBLISHER_ID = 'ca-pub-6250344265022238';
export const ADSENSE_SLOT_ID = '7770736190';

export const ADVERTISING_CONSENT_STORAGE_KEY = 'clickpdf_cookie_consent_v1';
export const ADVERTISING_CONSENT_CHANGED_EVENT = 'clickpdf-cookie-consent-change';

export function isValidAdSensePublisherId(publisherId) {
  return typeof publisherId === 'string' && /^ca-pub-\d{12,20}$/.test(publisherId);
}

export function isValidAdSenseSlotId(slotId) {
  return typeof slotId === 'string' && /^\d{6,20}$/.test(slotId);
}

export function shouldRequestAdUnit(publisherId, slotId, consentState) {
  return isValidAdSensePublisherId(publisherId) &&
    isValidAdSenseSlotId(slotId) &&
    consentState !== 'rejected';
}
