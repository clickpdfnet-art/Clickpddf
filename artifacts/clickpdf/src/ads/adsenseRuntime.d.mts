export interface AdSenseSlotIds {
  toolHeader: string;
  beforeBack: string;
}

export const ADSENSE_PUBLISHER_ID: string;
export const ADSENSE_SLOT_IDS: Readonly<AdSenseSlotIds>;
export const ADVERTISING_CONSENT_STORAGE_KEY: string;
export const ADVERTISING_CONSENT_CHANGED_EVENT: string;
export const ADSENSE_SCRIPT_URL: string;

export function isValidAdSensePublisherId(publisherId: string): boolean;
export function isValidAdSenseSlotId(slotId: string): boolean;
export function hasConfiguredAdSenseSlots(slotIds: Partial<AdSenseSlotIds> | null | undefined): boolean;
export function shouldLoadAdSense(
  publisherId: string,
  slotIds: Partial<AdSenseSlotIds> | null | undefined,
  consentState: string | null,
): boolean;
export function loadAdSenseScriptOnce(documentRef: Document, publisherId?: string): Promise<void>;
