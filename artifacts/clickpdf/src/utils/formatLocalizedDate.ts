export function formatLocalizedDate(value: string, locale: string): string {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;

  try {
    return new Intl.DateTimeFormat(locale, {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    }).format(date);
  } catch {
    return date.toLocaleDateString('en-US', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    });
  }
}

const readTimeTemplates: Record<string, (minutes: number) => string> = {
  en: (minutes) => `${minutes} min read`,
  ur: (minutes) => `${minutes} منٹ کا مطالعہ`,
  hi: (minutes) => `${minutes} मिनट पढ़ने का समय`,
  ar: (minutes) => `${minutes} دقائق للقراءة`,
  zh: (minutes) => `阅读约 ${minutes} 分钟`,
  ja: (minutes) => `読了時間 約${minutes}分`,
  tl: (minutes) => `${minutes} minutong babasahin`,
  de: (minutes) => `${minutes} Min. Lesezeit`,
  fr: (minutes) => `${minutes} min de lecture`,
  es: (minutes) => `${minutes} min de lectura`,
  it: (minutes) => `${minutes} min di lettura`,
  no: (minutes) => `${minutes} min lesetid`,
  pt: (minutes) => `${minutes} min de leitura`,
  ru: (minutes) => `${minutes} мин. чтения`,
  ko: (minutes) => `읽는 시간 ${minutes}분`,
  tr: (minutes) => `${minutes} dk okuma`,
  nl: (minutes) => `${minutes} min leestijd`,
  pl: (minutes) => `${minutes} min czytania`,
  sv: (minutes) => `${minutes} min läsning`,
  id: (minutes) => `${minutes} menit membaca`,
  vi: (minutes) => `${minutes} phút đọc`,
};

const bylineLabels: Record<string, string> = {
  en: 'By',
  ur: 'تحریر:',
  hi: 'लेखक:',
  ar: 'بقلم:',
  zh: '作者：',
  ja: '著者：',
  tl: 'May-akda:',
  de: 'Von',
  fr: 'Par',
  es: 'Por',
  it: 'Di',
  no: 'Av',
  pt: 'Por',
  ru: 'Автор:',
  ko: '작성자:',
  tr: 'Yazar:',
  nl: 'Door',
  pl: 'Autor:',
  sv: 'Av',
  id: 'Oleh',
  vi: 'Tác giả:',
};

export function formatLocalizedReadTime(value: string, locale: string): string {
  const minutes = Number(String(value).match(/\d+/)?.[0]);
  if (!Number.isFinite(minutes)) return value;
  return (readTimeTemplates[locale] || readTimeTemplates.en)(minutes);
}

export function formatLocalizedByline(author: string, locale: string): string {
  return `${bylineLabels[locale] || bylineLabels.en} ${author}`;
}
