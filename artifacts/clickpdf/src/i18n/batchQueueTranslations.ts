import batchQueueTranslations from './batchQueueTranslations.json';
import type { Language } from './translations';

export type BatchQueueCopy = typeof batchQueueTranslations.en;

export const BATCH_QUEUE_TRANSLATIONS = batchQueueTranslations as Record<
  Language,
  BatchQueueCopy
>;
