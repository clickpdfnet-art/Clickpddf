import legalInterfaceTranslations from './legalInterfaceTranslations.json';
import type { Language } from './translations';

export interface LegalInterfaceCopy {
  subtitle: string;
  openFullPage: string;
  closeModal: string;
  breadcrumb: string;
  relatedPages: string;
  emailSupport: string;
  contactName: string;
  contactNamePlaceholder: string;
  contactEmail: string;
  contactEmailPlaceholder: string;
  contactTopic: string;
  feedback: string;
  bugReport: string;
  featureRequest: string;
  partnership: string;
  privacyQuestion: string;
  otherInquiry: string;
  contactSubject: string;
  contactSubjectPlaceholder: string;
  contactMessage: string;
  contactMessagePlaceholder: string;
  confidentialityNote: string;
  submitMessage: string;
  successTitle: string;
  successBody: string;
  sendAnother: string;
}

export const LEGAL_INTERFACE_TRANSLATIONS = legalInterfaceTranslations as Record<
  Language,
  LegalInterfaceCopy
>;
