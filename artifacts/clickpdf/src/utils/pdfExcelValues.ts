import type { ExcelCell, ExcelFragment, PdfExcelLocale } from './pdfExcelTypes';

const arabicDigits = '٠١٢٣٤٥٦٧٨٩۰۱۲۳۴۵۶۷۸۹';
function asciiDigits(text: string) {
  return text.replace(/[٠-٩۰-۹]/g, char => {
    const digit = arabicDigits.indexOf(char);
    return String(digit >= 10 ? digit - 10 : digit);
  }).replace(/\u066b/g, '.').replace(/\u066c/g, ',');
}
const currency: Record<string, string> = {
  '$': '"$"#,##0.00;("$"#,##0.00)', '€': '"€"#,##0.00;("€"#,##0.00)',
  '£': '"£"#,##0.00;("£"#,##0.00)', '¥': '"¥"#,##0.00;("¥"#,##0.00)',
  '₹': '"₹"#,##0.00;("₹"#,##0.00)', '₨': '"₨"#,##0.00;("₨"#,##0.00)',
  'USD': '"USD "#,##0.00;("USD "#,##0.00)', 'EUR': '"EUR "#,##0.00;("EUR "#,##0.00)',
  'PKR': '"PKR "#,##0.00;("PKR "#,##0.00)', 'GBP': '"GBP "#,##0.00;("GBP "#,##0.00)'
};
const isoDate = /^(\d{4})[-/](\d{1,2})[-/](\d{1,2})$/;
const numericDate = /^(\d{1,2})[-/](\d{1,2})[-/](\d{4})$/;
function safeDate(year: number, month: number, day: number) {
  const date = new Date(Date.UTC(year, month - 1, day, 12));
  return year >= 1900 && year <= 9999 && date.getUTCFullYear() === year && date.getUTCMonth() === month - 1 && date.getUTCDate() === day ? date : null;
}
/** Return a spreadsheet type only when parsing cannot silently change an identifier or date. */
export function excelValue(raw: string, locale: PdfExcelLocale, issues?: Set<string>): Pick<ExcelCell, 'text' | 'value' | 'format' | 'kind'> {
  const text = raw.trim().replace(/\u00a0/g, ' ');
  const digits = asciiDigits(text);
  let match = digits.match(isoDate);
  if (match) {
    const value = safeDate(+match[1], +match[2], +match[3]);
    if (value) return { text, value, kind: 'date', format: 'yyyy-mm-dd' };
  }
  match = digits.match(numericDate);
  if (match) {
    const first = +match[1], second = +match[2];
    if (first <= 12 && second <= 12) { issues?.add('Ambiguous day/month dates are kept as text to prevent changing their meaning.'); return { text, value: text, kind: 'text' }; }
    const day = first > 12 ? first : second, month = first > 12 ? second : first;
    const value = safeDate(+match[3], month, day);
    if (value) return { text, value, kind: 'date', format: first > 12 ? 'dd/mm/yyyy' : 'mm/dd/yyyy' };
  }
  // Source identifiers must not lose leading zeros or Excel's 15-digit numeric precision.
  let candidate = digits.trim(), negative = false;
  if (/^\(.*\)$/.test(candidate)) { negative = true; candidate = candidate.slice(1, -1).trim(); }
  let signed = candidate.startsWith('-') || candidate.startsWith('+') ? candidate[0] : '';
  if (signed) candidate = candidate.slice(1).trim();
  const currencySymbol = Object.keys(currency).find(symbol => candidate.startsWith(symbol) || candidate.endsWith(symbol));
  if (currencySymbol) candidate = candidate.replace(currencySymbol, '').trim();
  const percent = candidate.endsWith('%');
  if (percent) candidate = candidate.slice(0, -1).trim();
  if (!signed && /^[+-]/.test(candidate)) { signed = candidate[0]; candidate = candidate.slice(1); }
  candidate = candidate.replace(/[ \u202f]/g, '');
  if (!/^[\d.,]+$/.test(candidate) || !/\d/.test(candidate) ||
    /^0\d/.test(candidate.replace(/[.,].*$/, '')) || candidate.replace(/\D/g, '').length > 15) {
    return { text, value: text, kind: 'text' };
  }
  const dot = candidate.lastIndexOf('.'), comma = candidate.lastIndexOf(',');
  let decimal: '.' | ',' | null = null;
  if (dot >= 0 && comma >= 0) decimal = dot > comma ? '.' : ',';
  else if (locale !== 'auto') decimal = locale === 'dot' ? '.' : ',';
  else if (dot >= 0) decimal = '.';
  else if (comma >= 0) {
    const lastGroupLength = candidate.length - comma - 1;
    decimal = lastGroupLength !== 3 ? ',' : null;
    if (!decimal) issues?.add('Values with a single comma and three trailing digits are treated as thousands; check locale if the source uses decimal commas.');
  }
  let canonical = candidate;
  if (decimal === ',') canonical = candidate.replace(/\./g, '').replace(/,/g, '.');
  else if (decimal === '.') canonical = candidate.replace(/,/g, '');
  else canonical = candidate.replace(/,/g, '');
  if (!/^\d+(?:\.\d+)?$/.test(canonical) || (candidate.match(new RegExp(`\\${decimal || 'x'}`, 'g')) || []).length > 1 ||
    (decimal === null && dot >= 0)) return { text, value: text, kind: 'text' };
  const number = Number(canonical) * (negative || signed === '-' ? -1 : 1) / (percent ? 100 : 1);
  if (!Number.isFinite(number)) return { text, value: text, kind: 'text' };
  const decimals = canonical.split('.')[1]?.length || 0;
  const format = percent ? `0.${'0'.repeat(Math.min(decimals, 8))}%`.replace('0.%', '0%')
    : currencySymbol ? currency[currencySymbol].replace(/0\.00/g, `0${decimals ? '.' + '0'.repeat(decimals) : ''}`)
      : decimals ? `#,##0.${'0'.repeat(Math.min(decimals, 10))}` : '#,##0';
  return { text, value: number, kind: 'number', format };
}

export function excelCell(fragments: ExcelFragment[], locale: PdfExcelLocale, issues?: Set<string>): ExcelCell {
  const sorted = [...fragments].sort((a, b) => a.x - b.x);
  let text = '';
  for (const [index, part] of sorted.entries()) {
    const previous = sorted[index - 1];
    if (previous && part.x - previous.x - previous.width > 1 && !/\s$/.test(text) && !/^\s/.test(part.text)) text += ' ';
    text += part.text;
  }
  return { ...excelValue(text, locale, issues), bold: fragments.some(item => item.bold),
    italic: fragments.some(item => item.italic), rtl: fragments.some(item => item.rtl) };
}
export function emptyExcelCell(): ExcelCell {
  return { text: '', value: '', kind: 'text', bold: false, italic: false, rtl: false };
}
