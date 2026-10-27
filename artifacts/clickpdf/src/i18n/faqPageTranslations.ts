import faqPageTranslations from './faqPageTranslations.json';
import type { Language } from './translations';
import type { FaqItem } from '../types';

export type FaqPageCopy = typeof faqPageTranslations.en.ui;
type LocalizedFaqItem = Pick<FaqItem, 'question' | 'answer' | 'categoryLabel' | 'highlights'>;

interface FaqLocaleData {
  ui: FaqPageCopy;
  items: Record<string, LocalizedFaqItem>;
}

export const FAQ_PAGE_TRANSLATIONS = faqPageTranslations as Record<Language, FaqLocaleData>;

const FAQ_NETWORK_CAVEATS: Record<Language, string> = {
  en: 'This describes file processing only: the page may still request resources, ads, or enabled third-party services. Offline use varies by tool and browser.',
  ur: 'یہ وضاحت صرف فائل پروسیسنگ کے بارے میں ہے؛ صفحہ پھر بھی resources، اشتہارات یا فعال فریقِ ثالث خدمات کے لیے درخواستیں بھیج سکتا ہے۔ آف لائن استعمال ٹول اور براؤزر کے لحاظ سے مختلف ہوتا ہے۔',
  hi: 'यह केवल फ़ाइल प्रोसेसिंग का वर्णन है; पेज संसाधनों, विज्ञापनों या सक्षम तृतीय-पक्ष सेवाओं के लिए अनुरोध कर सकता है। ऑफ़लाइन उपयोग टूल और ब्राउज़र के अनुसार बदलता है।',
  ar: 'هذا الوصف يخص معالجة الملفات فقط؛ فقد تطلب الصفحة موارد أو إعلانات أو خدمات خارجية مفعّلة. ويختلف الاستخدام دون اتصال باختلاف الأداة والمتصفح.',
  zh: '这仅说明文件处理方式：网页仍可能请求资源、广告或已启用的第三方服务。离线使用情况因工具和浏览器而异。',
  ja: 'これはファイル処理についての説明です。ページはリソース、広告、または有効な第三者サービスを引き続き要求する場合があります。オフラインでの利用可否はツールとブラウザによって異なります。',
  tl: 'Tungkol lamang ito sa pagproseso ng file: maaari pa ring humiling ang pahina ng mga resource, ad, o naka-enable na serbisyo ng third party. Nag-iiba ang offline na paggamit depende sa tool at browser.',
  de: 'Diese Aussage betrifft nur die Dateiverarbeitung: Die Seite kann weiterhin Ressourcen, Werbung oder aktivierte Dienste von Drittanbietern anfordern. Die Offline-Nutzung hängt vom Tool und Browser ab.',
  fr: 'Cette indication concerne uniquement le traitement des fichiers : la page peut encore demander des ressources, des publicités ou des services tiers activés. L’utilisation hors ligne dépend de l’outil et du navigateur.',
  es: 'Esto describe únicamente el procesamiento de archivos: la página aún puede solicitar recursos, anuncios o servicios de terceros habilitados. El uso sin conexión depende de la herramienta y del navegador.',
  it: 'Questa descrizione riguarda solo l’elaborazione dei file: la pagina può comunque richiedere risorse, annunci o servizi di terze parti abilitati. L’uso offline varia in base allo strumento e al browser.',
  no: 'Dette gjelder bare filbehandlingen: Siden kan fortsatt be om ressurser, annonser eller aktiverte tredjepartstjenester. Bruk uten nett avhenger av verktøyet og nettleseren.',
  pt: 'Esta descrição se refere apenas ao processamento de arquivos: a página ainda pode solicitar recursos, anúncios ou serviços de terceiros ativados. O uso offline varia conforme a ferramenta e o navegador.',
  ru: 'Это описание касается только обработки файлов: страница по-прежнему может запрашивать ресурсы, рекламу или включённые сторонние сервисы. Работа офлайн зависит от инструмента и браузера.',
  ko: '이는 파일 처리에 대한 설명일 뿐입니다. 페이지는 리소스, 광고 또는 활성화된 타사 서비스를 계속 요청할 수 있습니다. 오프라인 사용 여부는 도구와 브라우저에 따라 다릅니다.',
  tr: 'Bu açıklama yalnızca dosya işleme içindir; sayfa kaynaklar, reklamlar veya etkin üçüncü taraf hizmetleri için istek gönderebilir. Çevrimdışı kullanım araca ve tarayıcıya bağlıdır.',
  nl: 'Dit beschrijft alleen de bestandsverwerking: de pagina kan nog steeds bronnen, advertenties of ingeschakelde diensten van derden opvragen. Offline gebruik verschilt per tool en browser.',
  pl: 'Ten opis dotyczy wyłącznie przetwarzania plików: strona może nadal pobierać zasoby, reklamy lub włączone usługi zewnętrzne. Działanie offline zależy od narzędzia i przeglądarki.',
  sv: 'Detta beskriver endast filbehandlingen: sidan kan fortfarande begära resurser, annonser eller aktiverade tredjepartstjänster. Offlineanvändning varierar beroende på verktyg och webbläsare.',
  id: 'Keterangan ini hanya menjelaskan pemrosesan file: halaman tetap dapat meminta sumber daya, iklan, atau layanan pihak ketiga yang diaktifkan. Penggunaan offline bergantung pada alat dan browser.',
  vi: 'Mô tả này chỉ nói về việc xử lý tệp: trang vẫn có thể yêu cầu tài nguyên, quảng cáo hoặc dịch vụ bên thứ ba được bật. Khả năng dùng ngoại tuyến tùy thuộc vào công cụ và trình duyệt.',
};

export function getLocalizedFaqItem(item: FaqItem, language: Language): FaqItem {
  const localized = FAQ_PAGE_TRANSLATIONS[language].items[item.id];
  const result = localized ? { ...item, ...localized } : item;
  if (language === 'en' || !['privacy-zero-uploads', 'how-it-works-technology', 'offline-availability'].includes(item.id)) {
    return result;
  }
  return {
    ...result,
    answer: `${result.answer} ${FAQ_NETWORK_CAVEATS[language]}`,
  };
}
