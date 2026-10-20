export interface WordLanguage {
  id: string; name: string; nativeName: string; direction: 'rtl' | 'ltr';
  extraction: 'Unicode text layer required'; modelId: string;
  modelVersion: 'tessdata-4.0.0'; availability: 'downloadable-not-bundled';
  ocrTest: 'not-verified' | 'chromium-fixture'; textTest: 'fixture-covered' | 'not-verified';
  estimatedMB: number; limitations: string;
}
const rows: [string, string, string, 'rtl' | 'ltr', number][] = [
  ['eng', 'English', 'English', 'ltr', 11], ['urd', 'Urdu', 'اردو', 'rtl', 6],
  ['ara', 'Arabic', 'العربية', 'rtl', 3], ['jpn', 'Japanese', '日本語', 'ltr', 3],
  ['chi_sim', 'Chinese (Simplified)', '简体中文', 'ltr', 20], ['chi_tra', 'Chinese (Traditional)', '繁體中文', 'ltr', 24],
  ['hin', 'Hindi', 'हिन्दी', 'ltr', 2], ['fra', 'French', 'Français', 'ltr', 14],
  ['deu', 'German', 'Deutsch', 'ltr', 9], ['spa', 'Spanish', 'Español', 'ltr', 14],
  ['por', 'Portuguese', 'Português', 'ltr', 8], ['rus', 'Russian', 'Русский', 'ltr', 15],
  ['kor', 'Korean', '한국어', 'ltr', 17], ['ben', 'Bengali', 'বাংলা', 'ltr', 2],
  ['fas', 'Persian', 'فارسی', 'rtl', 3], ['ita', 'Italian', 'Italiano', 'ltr', 8],
  ['nld', 'Dutch', 'Nederlands', 'ltr', 9]
];
export const WORD_LANGUAGES: WordLanguage[] = rows.map(([id, name, nativeName, direction, estimatedMB]) => ({
  id, name, nativeName, direction, estimatedMB, extraction: 'Unicode text layer required',
  modelId: id, modelVersion: 'tessdata-4.0.0', availability: 'downloadable-not-bundled',
  ocrTest: 'not-verified', textTest: ['eng', 'urd', 'jpn'].includes(id) ? 'fixture-covered' : 'not-verified',
  limitations: 'Model availability is checked when selected; configuration is not a verified accuracy claim. Embedded fonts are not portable; review OCR, punctuation and combining marks.'
}));
export const WORD_MODEL_BASE = 'https://tessdata.projectnaptha.com/4.0.0';
export function wordModelUrl(id: string) {
  const entry = WORD_LANGUAGES.find(language => language.id === id);
  if (!entry) throw new Error(`OCR language "${id}" is not configured. No substitute language will be used.`);
  return `${WORD_MODEL_BASE}/${entry.modelId}.traineddata.gz`;
}
export function validateWordLanguages(ids: string[]) {
  if (!ids.length) throw new Error('Select at least one OCR language.');
  return [...new Set(ids)].map(id => {
    const language = WORD_LANGUAGES.find(entry => entry.id === id);
    if (!language) throw new Error(`OCR language "${id}" is unavailable. Extractable Unicode text can still be kept with OCR disabled.`);
    return language.id;
  });
}
export interface WordLanguageSuggestion {
  script: string; candidates: string[]; confidence: number; languageConfidence: number; note: string;
}
/** Bounded, local script detection. It never changes the user's OCR model. */
export function suggestWordLanguage(text: string): WordLanguageSuggestion {
  const sample = Array.from(text.slice(0, 4096)).filter(letter => /\p{L}/u.test(letter));
  const count = (pattern: RegExp) => sample.filter(letter => pattern.test(letter)).length;
  const scripts = [
    { script: 'Japanese kana', candidates: ['jpn'], count: count(/[\u3040-\u30ff]/u), distinct: true },
    { script: 'Korean Hangul', candidates: ['kor'], count: count(/[\uac00-\ud7af\u1100-\u11ff]/u), distinct: true },
    { script: 'Bengali', candidates: ['ben'], count: count(/[\u0980-\u09ff]/u), distinct: true },
    { script: 'Devanagari', candidates: ['hin'], count: count(/[\u0900-\u097f]/u), distinct: false },
    { script: 'Arabic family', candidates: ['urd', 'ara', 'fas'], count: count(/[\u0600-\u06ff\u0750-\u077f\u08a0-\u08ff]/u), distinct: false },
    { script: 'Han / CJK', candidates: ['chi_sim', 'chi_tra', 'jpn'], count: count(/[\u3400-\u9fff]/u), distinct: false },
    { script: 'Cyrillic', candidates: ['rus'], count: count(/[\u0400-\u052f]/u), distinct: false },
    { script: 'Latin', candidates: ['eng', 'fra', 'deu', 'spa', 'por', 'ita', 'nld'], count: count(/[A-Za-z\u00c0-\u024f]/u), distinct: false }
  ].filter(entry => entry.count).sort((a, b) => b.count - a.count);
  const kana = scripts.find(entry => entry.script === 'Japanese kana');
  const best = kana && kana.count >= 3 ? kana : scripts[0];
  if (!best || sample.length < 4) return { script: 'Unknown', candidates: [], confidence: 0, languageConfidence: 0, note: 'Insufficient text; choose the OCR language manually.' };
  const confidence = Math.round(100 * best.count / sample.length);
  return { script: scripts.filter(entry => entry.count / sample.length > .15).map(entry => entry.script).join(' + '),
    candidates: best.candidates, confidence, languageConfidence: best.distinct && best.count >= 6 ? Math.min(95, confidence) : 0,
    note: best.distinct ? 'Script-derived suggestion only; selected OCR languages remain unchanged.'
      : 'Script does not uniquely identify a language. Confirm the manual OCR selection; no automatic substitution.' };
}
export function parseWordPageRange(value: string, count: number): number[] {
  if (!value.trim()) return Array.from({ length: count }, (_, index) => index + 1);
  const selected = new Set<number>();
  for (const segment of value.split(',')) {
    const match = segment.trim().match(/^(\d+)(?:\s*-\s*(\d+))?$/);
    if (!match) throw new Error('Page range must look like 1-3, 5, 8.');
    const start = Number(match[1]), end = Number(match[2] || match[1]);
    if (start < 1 || end > count || start > end) throw new Error(`Page range is outside this ${count}-page PDF.`);
    for (let page = start; page <= end; page++) selected.add(page);
  }
  return [...selected].sort((a, b) => a - b);
}
export function parseWordPageModels(value: string, count: number) {
  const map = new Map<number, string[]>();
  if (!value.trim()) return map;
  for (const section of value.split(';').filter(Boolean)) {
    const parts = section.trim().split(':');
    if (parts.length !== 2) throw new Error('Page OCR overrides must look like 2:urd+eng; 5:jpn.');
    const languages = validateWordLanguages(parts[1].trim().split('+').map(item => item.trim()));
    for (const page of parseWordPageRange(parts[0], count)) map.set(page, languages);
  }
  return map;
}
export function wordLanguageSupportText() {
  return [
    'ClickPDF PDF to Word — actual support registry',
    'Selectable text: PDF Unicode mappings required; never reverse Unicode strings.',
    'OCR: models fetched on demand from an approved static model host; only model identifiers leave the device, not PDF data.',
    'Model sizes below are estimates, not verified Content-Length. Downloads show observed bytes.',
    'Worker and baseline LSTM WebAssembly core: bundled same-origin assets, one worker at a time.',
    'Automatic detection is a bounded script suggestion, never an automatic model switch. Scans require manual models.',
    'Every language combination is unverified unless explicitly documented. Mixed models can reduce accuracy and increase RAM use.',
    ...WORD_LANGUAGES.map(entry => `${entry.name} (${entry.id}) | ${entry.direction} | text: ${entry.textTest} | OCR: ${entry.ocrTest} | ${entry.availability} | ${entry.modelVersion} | ~${entry.estimatedMB} MB | ${entry.limitations}`),
    'Chrome / Edge: feature-detected; Chromium fixture tests are not a certification of every current release.',
    'Firefox / Safari: feature-detected but not verified in their native browser engines here.',
    'Safari: memory pressure, storage eviction/private mode, download prompts and worker/CSP restrictions can limit jobs.',
    'No File System Access API is required. Cache API is optional; model-cache failures are disclosed and processing uses memory.',
    'No native Word/LibreOffice layout comparison has been performed. Font availability depends on the receiving device.'
  ].join('\n');
}
