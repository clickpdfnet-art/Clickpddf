export const ADSENSE_PUBLISHER_ID: string;
export const ADSENSE_SLOT_ID: string;
export const ADVERTISING_CONSENT_STORAGE_KEY: string;
export const ADVERTISING_CONSENT_CHANGED_EVENT: string;

export function isValidAdSensePublisherId(publisherId: string): boolean;
export function isValidAdSenseSlotId(slotId: string): boolean;
export function shouldRequestAdUnit(
  publisherId: string,
  slotId: string,
  consentState: string | null,
): boolean;
