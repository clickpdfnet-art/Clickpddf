import faqPageTranslations from './faqPageTranslations.json';
import type { Language } from './translations';
import type { FaqItem } from '../types';

export type FaqPageCopy = typeof faqPageTranslations.en.ui;
type LocalizedFaqItem = Pick<FaqItem, 'question' | 'answer' | 'categoryLabel' | 'highlights'>;

interface FaqLocaleData {
  ui: FaqPageCopy;
  items: Record<string, LocalizedFaqItem>;
}

const rawFaqPageTranslations = faqPageTranslations as Record<Language, FaqLocaleData>;

const FAQ_UI_COPY: Record<Language, Partial<FaqPageCopy>> = {
  en: {
    description: 'Clear answers about browser-based file processing, page requests, privacy limits, and PDF specifications.',
    zeroUploadsVerified: 'Browser-Based File Processing',
    inspectMemoryDescription: 'Use DevTools > Network to review requests. Page resources, ads, or enabled services may appear; a request alone does not mean your file was uploaded.',
    privacyNote: 'Supported files are processed in-browser · Page network requests may still occur',
    technicalHighlights: 'Technical Details',
  },
  ur: {
    description: 'براؤزر میں فائل پروسیسنگ، صفحے کی نیٹ ورک درخواستوں، رازداری کی حدود اور PDF کی خصوصیات کے بارے میں واضح جوابات۔',
    zeroUploadsVerified: 'براؤزر میں فائل پروسیسنگ',
    inspectMemoryDescription: 'DevTools > Network میں درخواستیں دیکھیں۔ صفحے کے وسائل، اشتہارات یا فعال خدمات نظر آ سکتی ہیں؛ صرف درخواست سے یہ ثابت نہیں ہوتا کہ فائل اپ لوڈ ہوئی۔',
    privacyNote: 'معاونت یافتہ فائلیں براؤزر میں پروسیس ہوتی ہیں · صفحے کی نیٹ ورک درخواستیں پھر بھی ہو سکتی ہیں',
    technicalHighlights: 'تکنیکی تفصیلات',
  },
  hi: {
    description: 'ब्राउज़र में फ़ाइल प्रोसेसिंग, पेज अनुरोधों, गोपनीयता की सीमाओं और PDF विनिर्देशों के बारे में स्पष्ट उत्तर।',
    zeroUploadsVerified: 'ब्राउज़र-आधारित फ़ाइल प्रोसेसिंग',
    inspectMemoryDescription: 'DevTools > Network में अनुरोध देखें। पेज संसाधन, विज्ञापन या सक्षम सेवाएँ दिख सकती हैं; केवल अनुरोध दिखना फ़ाइल अपलोड होने का प्रमाण नहीं है।',
    privacyNote: 'समर्थित फ़ाइलें ब्राउज़र में प्रोसेस होती हैं · पेज के नेटवर्क अनुरोध फिर भी हो सकते हैं',
    technicalHighlights: 'तकनीकी विवरण',
  },
  ar: {
    description: 'إجابات واضحة حول معالجة الملفات في المتصفح وطلبات الصفحة وحدود الخصوصية ومواصفات PDF.',
    zeroUploadsVerified: 'معالجة الملفات في المتصفح',
    inspectMemoryDescription: 'استخدم DevTools > Network لمراجعة الطلبات. قد تظهر موارد الصفحة أو الإعلانات أو الخدمات المفعّلة؛ وظهور طلب لا يعني وحده أن الملف قد رُفع.',
    privacyNote: 'تُعالج الملفات المدعومة في المتصفح · وقد تظل الصفحة تجري طلبات عبر الشبكة',
    technicalHighlights: 'تفاصيل تقنية',
  },
  zh: {
    description: '了解浏览器文件处理、网页请求、隐私限制和 PDF 规范。',
    zeroUploadsVerified: '浏览器文件处理',
    inspectMemoryDescription: '使用 DevTools > Network 查看请求。页面资源、广告或已启用的服务可能产生请求；出现请求本身并不表示文件已上传。',
    privacyNote: '受支持的文件在浏览器中处理 · 网页仍可能发出网络请求',
    technicalHighlights: '技术详情',
  },
  ja: {
    description: 'ブラウザでのファイル処理、ページの通信、プライバシー上の制約、PDF仕様について説明します。',
    zeroUploadsVerified: 'ブラウザ内でのファイル処理',
    inspectMemoryDescription: 'DevTools > Networkで通信を確認できます。ページのリソース、広告、有効なサービスへの通信が表示される場合があり、通信があるだけでファイルのアップロードを意味するわけではありません。',
    privacyNote: '対応ファイルはブラウザ内で処理 · ページは通信を行う場合があります',
    technicalHighlights: '技術情報',
  },
  tl: {
    description: 'Malinaw na sagot tungkol sa pagproseso ng file sa browser, mga request ng page, mga limitasyon sa privacy, at mga detalye ng PDF.',
    zeroUploadsVerified: 'Pagproseso ng File sa Browser',
    inspectMemoryDescription: 'Gamitin ang DevTools > Network para suriin ang mga request. Maaaring lumabas ang resource ng page, ad, o naka-enable na serbisyo; hindi patunay ng file upload ang request lamang.',
    privacyNote: 'Pinoproseso sa browser ang mga suportadong file · Maaari pa ring magkaroon ng network request ang page',
    technicalHighlights: 'Mga Teknikal na Detalye',
  },
  de: {
    description: 'Klare Antworten zu browserbasierter Dateiverarbeitung, Seitenanfragen, Datenschutzgrenzen und PDF-Spezifikationen.',
    zeroUploadsVerified: 'Dateiverarbeitung im Browser',
    inspectMemoryDescription: 'Prüfen Sie Anfragen unter DevTools > Network. Seitenressourcen, Werbung oder aktivierte Dienste können erscheinen; eine Anfrage allein bedeutet nicht, dass Ihre Datei hochgeladen wurde.',
    privacyNote: 'Unterstützte Dateien werden im Browser verarbeitet · Seitenanfragen können trotzdem auftreten',
    technicalHighlights: 'Technische Details',
  },
  fr: {
    description: 'Réponses claires sur le traitement des fichiers dans le navigateur, les requêtes de la page, les limites de confidentialité et les spécifications PDF.',
    zeroUploadsVerified: 'Traitement des fichiers dans le navigateur',
    inspectMemoryDescription: 'Consultez les requêtes dans DevTools > Network. Des ressources, publicités ou services activés peuvent apparaître ; une requête seule ne signifie pas que votre fichier a été envoyé.',
    privacyNote: 'Les fichiers compatibles sont traités dans le navigateur · La page peut encore effectuer des requêtes réseau',
    technicalHighlights: 'Détails techniques',
  },
  es: {
    description: 'Respuestas claras sobre el procesamiento de archivos en el navegador, las solicitudes de la página, los límites de privacidad y las especificaciones PDF.',
    zeroUploadsVerified: 'Procesamiento de archivos en el navegador',
    inspectMemoryDescription: 'Revisa las solicitudes en DevTools > Network. Pueden aparecer recursos, anuncios o servicios habilitados; una solicitud por sí sola no significa que se haya subido tu archivo.',
    privacyNote: 'Los archivos compatibles se procesan en el navegador · La página aún puede hacer solicitudes de red',
    technicalHighlights: 'Detalles técnicos',
  },
  it: {
    description: 'Risposte chiare su elaborazione dei file nel browser, richieste della pagina, limiti della privacy e specifiche PDF.',
    zeroUploadsVerified: 'Elaborazione dei file nel browser',
    inspectMemoryDescription: 'Controlla le richieste in DevTools > Network. Possono comparire risorse, annunci o servizi attivati; una richiesta da sola non indica che il file sia stato caricato.',
    privacyNote: 'I file supportati sono elaborati nel browser · La pagina può comunque effettuare richieste di rete',
    technicalHighlights: 'Dettagli tecnici',
  },
  no: {
    description: 'Klare svar om filbehandling i nettleseren, sideforespørsler, personvernbegrensninger og PDF-spesifikasjoner.',
    zeroUploadsVerified: 'Filbehandling i nettleseren',
    inspectMemoryDescription: 'Se gjennom forespørsler i DevTools > Network. Sideressurser, annonser eller aktiverte tjenester kan vises; en forespørsel alene betyr ikke at filen er lastet opp.',
    privacyNote: 'Filer som støttes, behandles i nettleseren · Siden kan fortsatt gjøre nettverksforespørsler',
    technicalHighlights: 'Tekniske detaljer',
  },
  pt: {
    description: 'Respostas claras sobre processamento de arquivos no navegador, solicitações da página, limites de privacidade e especificações de PDF.',
    zeroUploadsVerified: 'Processamento de arquivos no navegador',
    inspectMemoryDescription: 'Confira as solicitações em DevTools > Network. Recursos da página, anúncios ou serviços ativados podem aparecer; uma solicitação, por si só, não significa que o arquivo foi enviado.',
    privacyNote: 'Arquivos compatíveis são processados no navegador · A página ainda pode fazer solicitações de rede',
    technicalHighlights: 'Detalhes técnicos',
  },
  ru: {
    description: 'Понятные ответы об обработке файлов в браузере, запросах страницы, ограничениях конфиденциальности и спецификациях PDF.',
    zeroUploadsVerified: 'Обработка файлов в браузере',
    inspectMemoryDescription: 'Проверьте запросы в DevTools > Network. Могут отображаться ресурсы страницы, реклама или включённые сервисы; сам запрос не означает, что файл был загружен.',
    privacyNote: 'Поддерживаемые файлы обрабатываются в браузере · Страница всё ещё может отправлять сетевые запросы',
    technicalHighlights: 'Технические сведения',
  },
  ko: {
    description: '브라우저 파일 처리, 페이지 요청, 개인정보 보호의 한계와 PDF 사양에 대한 명확한 답변입니다.',
    zeroUploadsVerified: '브라우저 파일 처리',
    inspectMemoryDescription: 'DevTools > Network에서 요청을 확인하세요. 페이지 리소스, 광고 또는 활성화된 서비스가 표시될 수 있으며, 요청이 있다는 사실만으로 파일 업로드를 의미하지는 않습니다.',
    privacyNote: '지원되는 파일은 브라우저에서 처리됩니다 · 페이지에서 네트워크 요청이 발생할 수 있습니다',
    technicalHighlights: '기술 세부 정보',
  },
  tr: {
    description: 'Tarayıcıda dosya işleme, sayfa istekleri, gizlilik sınırları ve PDF özellikleri hakkında net yanıtlar.',
    zeroUploadsVerified: 'Tarayıcıda Dosya İşleme',
    inspectMemoryDescription: 'İstekleri DevTools > Network bölümünde inceleyin. Sayfa kaynakları, reklamlar veya etkin hizmetler görünebilir; tek başına bir istek dosyanızın yüklendiği anlamına gelmez.',
    privacyNote: 'Desteklenen dosyalar tarayıcıda işlenir · Sayfa yine de ağ istekleri gönderebilir',
    technicalHighlights: 'Teknik Ayrıntılar',
  },
  nl: {
    description: 'Duidelijke antwoorden over bestandsverwerking in de browser, pagina-aanvragen, privacygrenzen en PDF-specificaties.',
    zeroUploadsVerified: 'Bestandsverwerking in de browser',
    inspectMemoryDescription: 'Bekijk aanvragen in DevTools > Network. Paginabronnen, advertenties of ingeschakelde diensten kunnen verschijnen; een aanvraag alleen betekent niet dat uw bestand is geüpload.',
    privacyNote: 'Ondersteunde bestanden worden in de browser verwerkt · De pagina kan nog netwerkverzoeken doen',
    technicalHighlights: 'Technische details',
  },
  pl: {
    description: 'Jasne odpowiedzi o przetwarzaniu plików w przeglądarce, żądaniach strony, ograniczeniach prywatności i specyfikacjach PDF.',
    zeroUploadsVerified: 'Przetwarzanie plików w przeglądarce',
    inspectMemoryDescription: 'Sprawdź żądania w DevTools > Network. Mogą pojawić się zasoby strony, reklamy lub włączone usługi; samo żądanie nie oznacza przesłania pliku.',
    privacyNote: 'Obsługiwane pliki są przetwarzane w przeglądarce · Strona może nadal wysyłać żądania sieciowe',
    technicalHighlights: 'Szczegóły techniczne',
  },
  sv: {
    description: 'Tydliga svar om filbehandling i webbläsaren, sidförfrågningar, integritetsbegränsningar och PDF-specifikationer.',
    zeroUploadsVerified: 'Filbehandling i webbläsaren',
    inspectMemoryDescription: 'Granska förfrågningar i DevTools > Network. Sidresurser, annonser eller aktiverade tjänster kan visas; en förfrågan i sig betyder inte att filen har laddats upp.',
    privacyNote: 'Filer som stöds behandlas i webbläsaren · Sidan kan fortfarande göra nätverksförfrågningar',
    technicalHighlights: 'Tekniska detaljer',
  },
  id: {
    description: 'Jawaban jelas tentang pemrosesan file di browser, permintaan halaman, batas privasi, dan spesifikasi PDF.',
    zeroUploadsVerified: 'Pemrosesan File di Browser',
    inspectMemoryDescription: 'Periksa permintaan di DevTools > Network. Sumber daya halaman, iklan, atau layanan aktif mungkin muncul; permintaan saja tidak berarti file Anda telah diunggah.',
    privacyNote: 'File yang didukung diproses di browser · Halaman tetap dapat membuat permintaan jaringan',
    technicalHighlights: 'Detail Teknis',
  },
  vi: {
    description: 'Câu trả lời rõ ràng về xử lý tệp trong trình duyệt, yêu cầu của trang, giới hạn quyền riêng tư và thông số PDF.',
    zeroUploadsVerified: 'Xử lý tệp trong trình duyệt',
    inspectMemoryDescription: 'Xem các yêu cầu trong DevTools > Network. Tài nguyên trang, quảng cáo hoặc dịch vụ được bật có thể xuất hiện; chỉ riêng yêu cầu không có nghĩa là tệp đã được tải lên.',
    privacyNote: 'Tệp được hỗ trợ xử lý trong trình duyệt · Trang vẫn có thể gửi yêu cầu mạng',
    technicalHighlights: 'Chi tiết kỹ thuật',
  },
};

export const FAQ_PAGE_TRANSLATIONS = Object.fromEntries(
  (Object.keys(rawFaqPageTranslations) as Language[]).map((language) => [
    language,
    {
      ...rawFaqPageTranslations[language],
      ui: { ...rawFaqPageTranslations[language].ui, ...FAQ_UI_COPY[language] },
    },
  ]),
) as Record<Language, FaqLocaleData>;

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

const FAQ_FILE_PROCESSING_ANSWERS: Record<Language, string> = {
  en: 'Supported tools process selected files in your browser instead of sending their contents to ClickPDF document-processing servers. Browser memory is managed by the browser; closing a tab is not a secure-erase guarantee.',
  ur: 'معاونت یافتہ ٹولز منتخب فائلیں براؤزر میں پروسیس کرتے ہیں اور ان کا مواد ClickPDF کے document-processing servers کو نہیں بھیجتے۔ میموری براؤزر کے کنٹرول میں ہوتی ہے؛ ٹیب بند کرنا محفوظ مٹانے کی ضمانت نہیں۔',
  hi: 'समर्थित टूल चुनी गई फ़ाइलों को ब्राउज़र में प्रोसेस करते हैं और उनकी सामग्री ClickPDF के दस्तावेज़-प्रसंस्करण सर्वरों को नहीं भेजते। मेमोरी ब्राउज़र के नियंत्रण में होती है; टैब बंद करना सुरक्षित मिटाने की गारंटी नहीं है।',
  ar: 'تعالج الأدوات المدعومة الملفات المحددة داخل المتصفح ولا ترسل محتواها إلى خوادم ClickPDF لمعالجة المستندات. يدير المتصفح الذاكرة؛ وإغلاق علامة التبويب لا يضمن محواً آمناً.',
  zh: '受支持的工具会在浏览器中处理所选文件，而不会将内容发送到 ClickPDF 文档处理服务器。内存由浏览器管理；关闭标签页不保证安全擦除。',
  ja: '対応ツールは選択したファイルをブラウザ内で処理し、その内容をClickPDFの文書処理サーバーへ送信しません。メモリはブラウザが管理するため、タブを閉じても安全な消去が保証されるわけではありません。',
  tl: 'Pinoproseso ng mga suportadong tool ang mga piniling file sa browser sa halip na ipadala ang nilalaman nito sa mga server ng ClickPDF para sa pagproseso ng dokumento. Browser ang namamahala ng memorya; hindi garantiya ng ligtas na pagbura ang pagsasara ng tab.',
  de: 'Unterstützte Tools verarbeiten ausgewählte Dateien im Browser, statt deren Inhalte an die Dokumentverarbeitungsserver von ClickPDF zu senden. Der Browser verwaltet den Speicher; das Schließen eines Tabs garantiert kein sicheres Löschen.',
  fr: 'Les outils compatibles traitent les fichiers sélectionnés dans le navigateur sans envoyer leur contenu aux serveurs de traitement documentaire de ClickPDF. Le navigateur gère la mémoire ; fermer un onglet ne garantit pas un effacement sécurisé.',
  es: 'Las herramientas compatibles procesan los archivos seleccionados en el navegador, en lugar de enviar su contenido a los servidores de procesamiento de ClickPDF. El navegador administra la memoria; cerrar una pestaña no garantiza un borrado seguro.',
  it: 'Gli strumenti supportati elaborano i file selezionati nel browser senza inviarne il contenuto ai server di elaborazione documentale di ClickPDF. La memoria è gestita dal browser; chiudere una scheda non garantisce una cancellazione sicura.',
  no: 'Verktøy som støttes, behandler valgte filer i nettleseren i stedet for å sende innholdet til ClickPDFs dokumentbehandlingsservere. Nettleseren styrer minnet; det å lukke en fane garanterer ikke sikker sletting.',
  pt: 'As ferramentas compatíveis processam os arquivos selecionados no navegador, sem enviar o conteúdo aos servidores de processamento de documentos do ClickPDF. O navegador gerencia a memória; fechar uma aba não garante uma eliminação segura.',
  ru: 'Поддерживаемые инструменты обрабатывают выбранные файлы в браузере, не отправляя их содержимое на серверы ClickPDF для обработки документов. Памятью управляет браузер; закрытие вкладки не гарантирует безопасное удаление.',
  ko: '지원되는 도구는 선택한 파일을 브라우저에서 처리하며 내용을 ClickPDF 문서 처리 서버로 보내지 않습니다. 메모리는 브라우저가 관리하므로 탭을 닫아도 안전한 삭제가 보장되지는 않습니다.',
  tr: 'Desteklenen araçlar seçilen dosyaları tarayıcıda işler ve içeriğini ClickPDF belge işleme sunucularına göndermez. Belleği tarayıcı yönetir; sekmeyi kapatmak güvenli silme garantisi vermez.',
  nl: 'Ondersteunde tools verwerken geselecteerde bestanden in uw browser in plaats van de inhoud naar ClickPDF-documentverwerkingsservers te sturen. De browser beheert het geheugen; een tabblad sluiten garandeert geen veilig wissen.',
  pl: 'Obsługiwane narzędzia przetwarzają wybrane pliki w przeglądarce, zamiast wysyłać ich zawartość na serwery ClickPDF do przetwarzania dokumentów. Pamięcią zarządza przeglądarka; zamknięcie karty nie gwarantuje bezpiecznego usunięcia.',
  sv: 'Verktyg som stöds behandlar valda filer i webbläsaren i stället för att skicka innehållet till ClickPDFs dokumentbehandlingsservrar. Webbläsaren hanterar minnet; att stänga en flik garanterar inte säker radering.',
  id: 'Alat yang didukung memproses file pilihan di browser, bukan mengirim isinya ke server pemrosesan dokumen ClickPDF. Browser mengelola memori; menutup tab bukan jaminan penghapusan aman.',
  vi: 'Các công cụ được hỗ trợ xử lý tệp đã chọn trong trình duyệt thay vì gửi nội dung đến máy chủ xử lý tài liệu của ClickPDF. Trình duyệt quản lý bộ nhớ; đóng tab không đảm bảo xóa an toàn.',
};

const FAQ_COMPLIANCE_ANSWERS: Record<Language, string> = {
  en: 'Browser-based processing can reduce exposure to external document processors, but it does not by itself establish GDPR, HIPAA, or FERPA compliance or guarantee security. Check your organization’s policies, device controls, and the page’s network activity.',
  ur: 'براؤزر میں پروسیسنگ بیرونی دستاویز پروسیسرز تک فائل پہنچنے کا امکان کم کر سکتی ہے، لیکن اس سے GDPR، HIPAA یا FERPA کی تعمیل یا مکمل سیکیورٹی کی ضمانت نہیں ملتی۔ اپنی تنظیم کی پالیسی، ڈیوائس کے تحفظ اور صفحے کی نیٹ ورک سرگرمی کا جائزہ لیں۔',
  hi: 'ब्राउज़र में प्रोसेसिंग बाहरी दस्तावेज़ प्रोसेसर तक फ़ाइल पहुँचने का जोखिम घटा सकती है, लेकिन इससे GDPR, HIPAA या FERPA अनुपालन स्थापित नहीं होता और न ही सुरक्षा की गारंटी मिलती है। अपनी संस्था की नीतियों, डिवाइस सुरक्षा और पेज की नेटवर्क गतिविधि की जाँच करें।',
  ar: 'قد تقلل المعالجة في المتصفح من تعرض الملفات لمعالجي المستندات الخارجيين، لكنها لا تثبت وحدها الامتثال لـ GDPR أو HIPAA أو FERPA ولا تضمن الأمان. راجع سياسات مؤسستك وضوابط الجهاز ونشاط الشبكة للصفحة.',
  zh: '浏览器处理可减少文件交给外部文档处理服务的机会，但这本身不代表符合 GDPR、HIPAA 或 FERPA，也不构成安全保证。请核对组织政策、设备控制和网页网络活动。',
  ja: 'ブラウザ内処理は外部の文書処理サービスにファイルを渡すリスクを減らせますが、それだけでGDPR・HIPAA・FERPAへの準拠や安全性が保証されるわけではありません。組織の方針、端末の管理状況、ページの通信を確認してください。',
  tl: 'Maaaring mabawasan ng pagproseso sa browser ang paglantad sa mga panlabas na tagaproseso ng dokumento, ngunit hindi nito kusang pinatutunayan ang pagsunod sa GDPR, HIPAA, o FERPA at hindi nito ginagarantiya ang seguridad. Suriin ang mga patakaran ng organisasyon, seguridad ng device, at network activity ng page.',
  de: 'Browserbasierte Verarbeitung kann die Weitergabe an externe Dokumentverarbeiter verringern, belegt aber weder die Einhaltung von DSGVO, HIPAA oder FERPA noch garantiert sie Sicherheit. Prüfen Sie die Richtlinien Ihrer Organisation, Geräteschutz und Netzwerkaktivität der Seite.',
  fr: 'Le traitement dans le navigateur peut réduire l’exposition aux prestataires externes, mais ne suffit pas à établir la conformité au RGPD, à HIPAA ou à FERPA et ne garantit pas la sécurité. Vérifiez les règles de votre organisation, la sécurité de l’appareil et l’activité réseau de la page.',
  es: 'El procesamiento en el navegador puede reducir la exposición a proveedores externos, pero no demuestra por sí solo el cumplimiento de GDPR, HIPAA o FERPA ni garantiza la seguridad. Revisa las políticas de tu organización, la seguridad del dispositivo y la actividad de red de la página.',
  it: 'L’elaborazione nel browser può ridurre l’esposizione a fornitori esterni, ma non dimostra da sola la conformità a GDPR, HIPAA o FERPA né garantisce la sicurezza. Verifica le politiche dell’organizzazione, la sicurezza del dispositivo e l’attività di rete della pagina.',
  no: 'Nettleserbasert behandling kan redusere eksponeringen for eksterne dokumentbehandlere, men dokumenterer ikke i seg selv samsvar med GDPR, HIPAA eller FERPA og garanterer ikke sikkerhet. Kontroller organisasjonens regler, enhetssikkerhet og sidens nettverksaktivitet.',
  pt: 'O processamento no navegador pode reduzir a exposição a prestadores externos, mas não comprova por si só a conformidade com GDPR, HIPAA ou FERPA nem garante segurança. Verifique as políticas da organização, a segurança do dispositivo e a atividade de rede da página.',
  ru: 'Обработка в браузере может снизить передачу файлов внешним сервисам, но сама по себе не подтверждает соответствие GDPR, HIPAA или FERPA и не гарантирует безопасность. Проверьте правила организации, защиту устройства и сетевую активность страницы.',
  ko: '브라우저 처리는 외부 문서 처리 서비스에 파일을 제공할 위험을 줄일 수 있지만, 그 자체로 GDPR·HIPAA·FERPA 준수나 보안을 보장하지는 않습니다. 조직 정책, 기기 보안 및 페이지의 네트워크 활동을 확인하세요.',
  tr: 'Tarayıcıda işleme, harici belge işleme hizmetlerine maruziyeti azaltabilir; ancak tek başına GDPR, HIPAA veya FERPA uyumluluğunu kanıtlamaz ve güvenliği garanti etmez. Kurum politikalarını, cihaz güvenliğini ve sayfanın ağ etkinliğini inceleyin.',
  nl: 'Verwerking in de browser kan blootstelling aan externe documentverwerkers verminderen, maar bewijst op zichzelf geen naleving van AVG, HIPAA of FERPA en garandeert geen veiligheid. Controleer het beleid van uw organisatie, apparaatbeveiliging en netwerkactiviteit van de pagina.',
  pl: 'Przetwarzanie w przeglądarce może ograniczyć przekazywanie plików zewnętrznym usługom, ale samo w sobie nie potwierdza zgodności z RODO, HIPAA ani FERPA i nie gwarantuje bezpieczeństwa. Sprawdź zasady organizacji, zabezpieczenia urządzenia i aktywność sieciową strony.',
  sv: 'Webbläsarbaserad behandling kan minska exponeringen för externa dokumenttjänster, men visar inte i sig att GDPR, HIPAA eller FERPA följs och garanterar inte säkerhet. Kontrollera organisationens regler, enhetens skydd och sidans nätverksaktivitet.',
  id: 'Pemrosesan di browser dapat mengurangi paparan ke pemroses dokumen eksternal, tetapi tidak dengan sendirinya membuktikan kepatuhan GDPR, HIPAA, atau FERPA maupun menjamin keamanan. Periksa kebijakan organisasi, perlindungan perangkat, dan aktivitas jaringan halaman.',
  vi: 'Xử lý trong trình duyệt có thể giảm việc chuyển tệp cho dịch vụ bên ngoài, nhưng không tự chứng minh việc tuân thủ GDPR, HIPAA hoặc FERPA và không đảm bảo an toàn. Hãy kiểm tra chính sách tổ chức, bảo mật thiết bị và hoạt động mạng của trang.',
};

export function getLocalizedFaqItem(item: FaqItem, language: Language): FaqItem {
  const localized = FAQ_PAGE_TRANSLATIONS[language].items[item.id];
  const result = localized ? { ...item, ...localized } : item;
  if (language !== 'en' && item.id === 'compliance-gdpr-hipaa') {
    return {
      ...result,
      answer: FAQ_COMPLIANCE_ANSWERS[language],
      highlights: [],
    };
  }
  if (language !== 'en' && ['privacy-zero-uploads', 'offline-availability'].includes(item.id)) {
    return {
      ...result,
      answer: `${FAQ_FILE_PROCESSING_ANSWERS[language]} ${FAQ_NETWORK_CAVEATS[language]}`,
      highlights: [],
    };
  }
  if (language === 'en' || !['privacy-zero-uploads', 'how-it-works-technology', 'offline-availability'].includes(item.id)) {
    return result;
  }
  return {
    ...result,
    answer: `${result.answer} ${FAQ_NETWORK_CAVEATS[language]}`,
  };
}
