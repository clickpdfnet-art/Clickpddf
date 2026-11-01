import { readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { readActiveToolRegistry } from './static-tool-registry.mjs';

const appDir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const contentPath = path.join(appDir, 'src', 'i18n', 'toolSeoContentTranslations.json');
const qaPath = path.join(appDir, 'src', 'i18n', 'toolSeoTranslationQa.json');
const candidateToolIds = ['crop', 'repair', 'compare', 'powerpoint-to-pdf'];

// Draft localization copy for the newly released tools. These entries are
// intentionally marked unreviewed until a native speaker approves them.
const copy = {
  ja: {
    about: '{tool}の使い方', stepsHeading: '{tool}の使い方：3つの手順', stepTitles: ['ファイルを選択', '処理を実行', '結果を確認'],
    select: 'デバイスから対応ファイルを選び、ワークスペースに追加します。', review: '出力を開き、内容を確認してから利用してください。',
    questions: ['このツールで何ができますか？', '元のファイルは変更されますか？', '同時に何ファイル処理できますか？', '利用前に知っておくべき制限は？', 'ファイルの処理はどこで行われますか？', '出力を確認する必要がありますか？'],
    source: 'いいえ。処理結果は別ファイルとして作成され、元のファイルは変更されません。',
    multiple: ['複数のPDFを同じ設定で処理し、結果をZIPで保存できます。', '複数のPDFを順に試し、成功した結果をZIPにまとめられます。', '比較にはPDFが2つ必要です。元ファイルを先に、改訂版を次に選んでください。', '複数のPPTXを処理し、PDFをZIPでダウンロードできます。'],
    browser: '対応する文書処理はブラウザー内で行われます。ページのリソースや有効な第三者機能は通常の通信を行う場合があります。',
    reviewAnswer: 'はい。重要なページや内容を確認し、必要に応じて元ファイルと照合してください。',
    operations: ['全ページの四辺に同じ割合を適用し、PDFのCropBoxを変更します。', '読み込めるPDFを再保存し、同じページ数で再度開けるか確認します。', '2つのPDFから選択可能なテキストをページごとに比較します。', 'PPTXのテキストを抽出し、新しい基本的なPDFページに配置します。'],
    limits: ['CropBoxの外側にある内容は削除されません。安全な墨消しには使えません。', '復元は保証されず、欠落・切断した内容は復元できません。', '画像、レイアウト、書式、OCR前のスキャン文字は比較しません。', '元の画像、配置、グラフ、テーマ、ノート、アニメーションは再現されません。'],
  },
  ur: {
    about: '{tool} استعمال کرنے کا طریقہ', stepsHeading: '{tool} استعمال کرنے کے تین مراحل', stepTitles: ['فائل منتخب کریں', 'عمل چلائیں', 'نتیجہ دیکھیں'],
    select: 'اپنے آلے سے معاون فائل منتخب کر کے ورک اسپیس میں شامل کریں۔', review: 'استعمال سے پہلے آؤٹ پٹ کھول کر اہم مواد کی جانچ کریں۔',
    questions: ['یہ ٹول کیا کرتا ہے؟', 'کیا اصل فائل تبدیل ہوتی ہے؟', 'ایک ساتھ کتنی فائلیں چل سکتی ہیں؟', 'استعمال سے پہلے کون سی حد جاننی چاہیے؟', 'فائلوں کی کارروائی کہاں ہوتی ہے؟', 'کیا آؤٹ پٹ کی جانچ ضروری ہے؟'],
    source: 'نہیں۔ نتیجہ الگ فائل میں بنتا ہے اور اصل فائل تبدیل نہیں ہوتی۔',
    multiple: ['ایک ہی ترتیب کے ساتھ کئی PDFs پر کارروائی کر کے ZIP حاصل کر سکتے ہیں۔', 'کئی PDFs پر الگ الگ کوشش ہوتی ہے؛ کامیاب نتائج ZIP میں ملتے ہیں۔', 'موازنہ کے لیے عین دو PDFs چاہئیں: پہلے اصل، پھر نظرثانی شدہ فائل۔', 'کئی PPTX فائلیں چلائی جا سکتی ہیں اور PDFs ZIP میں ملتی ہیں۔'],
    browser: 'معاون دستاویز پروسیسنگ براؤزر میں ہوتی ہے۔ صفحے کے وسائل اور فعال تھرڈ پارٹی سروسز معمول کی درخواستیں کر سکتی ہیں۔',
    reviewAnswer: 'ہاں۔ اہم صفحات اور مواد کی جانچ کریں اور ضرورت ہو تو اصل فائل سے موازنہ کریں۔',
    operations: ['ہر صفحے کے چاروں کناروں پر ایک ہی تناسب لگا کر PDF کا CropBox بدلتا ہے۔', 'قابلِ مطالعہ PDF کو دوبارہ محفوظ کر کے اسی صفحہ تعداد کے ساتھ کھلنے کی جانچ کرتا ہے۔', 'دو PDFs میں منتخب کیے جا سکنے والے متن کا صفحہ بہ صفحہ موازنہ کرتا ہے۔', 'PPTX سے متن نکال کر نئے سادہ PDF صفحات میں رکھتا ہے۔'],
    limits: ['CropBox سے باہر کا مواد حذف نہیں ہوتا؛ اسے محفوظ redaction نہ سمجھیں۔', 'بحالی کی ضمانت نہیں؛ غائب یا کٹا ہوا مواد واپس نہیں آ سکتا۔', 'تصاویر، layout، formatting یا OCR کے بغیر scan شدہ متن کا موازنہ نہیں ہوتا۔', 'اصل تصاویر، layout، charts، theme، notes اور animations شامل نہیں ہوتے۔'],
  },
  de: {
    about: 'So verwenden Sie {tool}', stepsHeading: '{tool} in drei Schritten verwenden', stepTitles: ['Dateien auswählen', 'Vorgang starten', 'Ergebnis prüfen'],
    select: 'Wählen Sie unterstützte Dateien von Ihrem Gerät und fügen Sie sie dem Arbeitsbereich hinzu.', review: 'Öffnen und prüfen Sie die Ausgabe, bevor Sie sie verwenden.',
    questions: ['Was macht dieses Tool?', 'Wird die Quelldatei geändert?', 'Wie viele Dateien kann ich verarbeiten?', 'Welche Einschränkungen sollte ich kennen?', 'Wo werden die Dateien verarbeitet?', 'Sollte ich das Ergebnis prüfen?'],
    source: 'Nein. Das Ergebnis wird als separate Datei erstellt; die Quelldatei bleibt unverändert.',
    multiple: ['Mehrere PDFs können mit derselben Einstellung verarbeitet und als ZIP gespeichert werden.', 'Mehrere PDFs werden einzeln versucht; erfolgreiche Ergebnisse kommen in ein ZIP.', 'Zum Vergleich sind genau zwei PDFs erforderlich: zuerst das Original, dann die überarbeitete Datei.', 'Mehrere PPTX-Dateien können verarbeitet und die PDFs als ZIP geladen werden.'],
    browser: 'Die unterstützte Dokumentverarbeitung läuft im Browser. Seitenressourcen und aktivierte Drittanbieterdienste können normale Netzwerkanfragen auslösen.',
    reviewAnswer: 'Ja. Prüfen Sie wichtige Seiten und Inhalte und vergleichen Sie sie bei Bedarf mit der Quelle.',
    operations: ['Ändert die PDF-CropBox mit demselben Prozentsatz an allen vier Seiten jeder Seite.', 'Speichert ein ladbares PDF neu und prüft, ob es mit derselben Seitenzahl wieder geöffnet werden kann.', 'Vergleicht den auswählbaren Text aus genau zwei PDFs Seite für Seite.', 'Extrahiert PPTX-Text und setzt ihn auf neue einfache PDF-Seiten.'],
    limits: ['Inhalt außerhalb der CropBox wird nicht gelöscht. Dies ist keine sichere Schwärzung.', 'Eine Wiederherstellung ist nicht garantiert; fehlende oder abgeschnittene Inhalte lassen sich nicht erzeugen.', 'Bilder, Layout, Formatierung und nicht per OCR erkannter Scantext werden nicht verglichen.', 'Originalbilder, Positionen, Diagramme, Designs, Notizen und Animationen bleiben unberücksichtigt.'],
  },
  hi: {
    about: '{tool} का उपयोग कैसे करें', stepsHeading: '{tool} के लिए तीन चरण', stepTitles: ['फ़ाइलें चुनें', 'प्रक्रिया चलाएँ', 'परिणाम जाँचें'],
    select: 'अपने डिवाइस से समर्थित फ़ाइलें चुनकर वर्कस्पेस में जोड़ें।', review: 'उपयोग से पहले आउटपुट खोलें और उसकी जाँच करें।',
    questions: ['यह टूल क्या करता है?', 'क्या मूल फ़ाइल बदलती है?', 'एक बार में कितनी फ़ाइलें चलेंगी?', 'कौन-सी सीमाएँ जानना ज़रूरी है?', 'फ़ाइलों की प्रक्रिया कहाँ होती है?', 'क्या आउटपुट जाँचना चाहिए?'],
    source: 'नहीं। परिणाम अलग फ़ाइल में बनता है और मूल फ़ाइल अपरिवर्तित रहती है।',
    multiple: ['एक ही सेटिंग से कई PDF चलाकर ZIP में सहेज सकते हैं।', 'कई PDF पर अलग-अलग प्रयास होते हैं; सफल परिणाम ZIP में मिलते हैं।', 'तुलना के लिए ठीक दो PDF चुनें: पहले मूल, फिर संशोधित प्रति।', 'कई PPTX चलाकर PDF परिणाम ZIP में डाउनलोड कर सकते हैं।'],
    browser: 'समर्थित दस्तावेज़ प्रक्रिया ब्राउज़र में होती है। पेज संसाधन और चालू तृतीय-पक्ष सुविधाएँ सामान्य नेटवर्क अनुरोध कर सकती हैं।',
    reviewAnswer: 'हाँ। ज़रूरी पेज और सामग्री जाँचें और आवश्यकता हो तो मूल फ़ाइल से मिलाएँ।',
    operations: ['हर पेज के चारों किनारों पर समान प्रतिशत लगाकर PDF CropBox बदलता है।', 'पार्सर से पढ़ी जा सकने वाली PDF को फिर से सहेजकर समान पेज संख्या के साथ खुलने की जाँच करता है।', 'ठीक दो PDF के चुने जा सकने वाले टेक्स्ट की पेज-दर-पेज तुलना करता है।', 'PPTX से टेक्स्ट निकालकर नए साधारण PDF पेज बनाता है।'],
    limits: ['CropBox के बाहर की सामग्री मिटती नहीं; यह सुरक्षित redaction नहीं है।', 'बहाली की गारंटी नहीं; गायब या कटे हुए हिस्से वापस नहीं बनाए जा सकते।', 'चित्र, लेआउट, formatting और OCR के बिना स्कैन किए गए टेक्स्ट की तुलना नहीं होती।', 'मूल चित्र, लेआउट, चार्ट, थीम, नोट्स और एनिमेशन शामिल नहीं होते।'],
  },
  ar: {
    about: 'كيفية استخدام {tool}', stepsHeading: 'استخدم {tool} في ثلاث خطوات', stepTitles: ['اختر الملفات', 'ابدأ المعالجة', 'راجع النتيجة'],
    select: 'اختر الملفات المدعومة من جهازك وأضفها إلى مساحة العمل.', review: 'افتح الملف الناتج وتحقق منه قبل استخدامه.',
    questions: ['ماذا تفعل هذه الأداة؟', 'هل يتغير الملف الأصلي؟', 'كم ملفًا يمكن معالجته؟', 'ما القيود التي يجب معرفتها؟', 'أين تتم معالجة الملفات؟', 'هل ينبغي مراجعة الناتج؟'],
    source: 'لا. يُنشأ الناتج في ملف منفصل ولا يتغير الملف الأصلي.',
    multiple: ['يمكن معالجة عدة ملفات PDF بالإعداد نفسه وتنزيل النتائج في ZIP.', 'تُجرّب ملفات PDF كلٌّ على حدة وتُجمع النتائج الناجحة في ZIP.', 'يلزم ملفا PDF بالضبط: الأصل أولًا ثم النسخة المعدلة.', 'يمكن معالجة ملفات PPTX متعددة وتنزيل ملفات PDF في ZIP.'],
    browser: 'تتم معالجة المستندات المدعومة في المتصفح. وقد تجري موارد الصفحة والخدمات الخارجية المفعّلة طلبات شبكة عادية.',
    reviewAnswer: 'نعم. راجع الصفحات والمحتوى المهم وقارن بالأصل عند الحاجة.',
    operations: ['تغيّر CropBox في PDF بنسبة موحدة على الجوانب الأربعة لكل صفحة.', 'تعيد حفظ ملف PDF يمكن للمحلل قراءته وتتحقق من فتحه مع عدد الصفحات نفسه.', 'تقارن النص القابل للتحديد في ملفي PDF صفحةً بصفحة.', 'تستخرج النص من PPTX وتضعه في صفحات PDF أساسية جديدة.'],
    limits: ['لا يُحذف المحتوى خارج CropBox؛ فهذا ليس إخفاءً آمنًا للمعلومات.', 'الاستعادة غير مضمونة ولا يمكن إنشاء محتوى مفقود أو مبتور.', 'لا تقارن الأداة الصور أو التخطيط أو التنسيق أو نص الصفحات الممسوحة دون OCR.', 'لا تُحفظ الصور أو التخطيط أو المخططات أو السمات أو الملاحظات أو الحركات الأصلية.'],
  },
  fr: {
    about: 'Utiliser {tool}', stepsHeading: 'Utiliser {tool} en trois étapes', stepTitles: ['Choisir les fichiers', 'Lancer le traitement', 'Vérifier le résultat'],
    select: 'Sélectionnez les fichiers compatibles sur votre appareil et ajoutez-les à l’espace de travail.', review: 'Ouvrez le résultat et vérifiez-le avant de l’utiliser.',
    questions: ['Que fait cet outil ?', 'Le fichier source est-il modifié ?', 'Combien de fichiers puis-je traiter ?', 'Quelles limites faut-il connaître ?', 'Où les fichiers sont-ils traités ?', 'Faut-il vérifier le résultat ?'],
    source: 'Non. Le résultat est créé dans un fichier distinct et le fichier source reste inchangé.',
    multiple: ['Plusieurs PDF peuvent être traités avec le même réglage et récupérés dans un ZIP.', 'Plusieurs PDF sont essayés séparément ; les résultats réussis sont placés dans un ZIP.', 'Deux PDF exactement sont requis : l’original d’abord, puis la version révisée.', 'Plusieurs PPTX peuvent être traités et les PDF téléchargés dans un ZIP.'],
    browser: 'Le traitement pris en charge s’effectue dans le navigateur. Les ressources de la page et les services tiers activés peuvent effectuer des requêtes réseau ordinaires.',
    reviewAnswer: 'Oui. Vérifiez les pages et le contenu importants, puis comparez-les à la source si nécessaire.',
    operations: ['Modifie la CropBox du PDF avec le même pourcentage sur les quatre côtés de chaque page.', 'Réenregistre un PDF lisible par le parseur et vérifie qu’il s’ouvre avec le même nombre de pages.', 'Compare le texte sélectionnable de deux PDF, page par page.', 'Extrait le texte d’un PPTX et le place sur de nouvelles pages PDF simples.'],
    limits: ['Le contenu hors de la CropBox n’est pas supprimé ; ce n’est pas une caviardage sécurisé.', 'La récupération n’est pas garantie et ne recrée pas le contenu manquant ou tronqué.', 'Les images, la mise en page, le formatage et le texte scanné sans OCR ne sont pas comparés.', 'Les images, positions, graphiques, thèmes, notes et animations d’origine ne sont pas conservés.'],
  },
  zh: {
    about: '如何使用{tool}', stepsHeading: '{tool}的三个步骤', stepTitles: ['选择文件', '运行处理', '检查结果'],
    select: '从设备中选择支持的文件并添加到工作区。', review: '打开输出文件并检查内容后再使用。',
    questions: ['此工具有什么作用？', '原始文件会被修改吗？', '一次可以处理多少文件？', '使用前应了解哪些限制？', '文件在哪里处理？', '需要检查输出吗？'],
    source: '不会。结果会另存为新文件，原始文件保持不变。',
    multiple: ['可用相同设置处理多个 PDF，并将结果保存为 ZIP。', '多个 PDF 会逐个尝试，成功的结果会打包为 ZIP。', '比较必须选择两个 PDF：先选原件，再选修订版。', '可处理多个 PPTX，并将生成的 PDF 下载为 ZIP。'],
    browser: '支持的文档处理在浏览器中进行。网页资源和已启用的第三方服务仍可能发出常规网络请求。',
    reviewAnswer: '需要。请检查重要页面和内容，必要时与源文件核对。',
    operations: ['对每页四边应用相同百分比，以调整 PDF CropBox。', '重新保存解析器仍可读取的 PDF，并检查页数相同的文件能否重新打开。', '逐页比较两个 PDF 中可选择的文本。', '提取 PPTX 文本并排版到新的基础 PDF 页面。'],
    limits: ['CropBox 之外的内容不会被删除；这不是安全涂黑。', '无法保证修复，也不能恢复缺失或截断的内容。', '不会比较图像、版式、格式或未经过 OCR 的扫描文字。', '不会保留原始图像、位置、图表、主题、备注或动画。'],
  },
  tl: {
    about: 'Paano gamitin ang {tool}', stepsHeading: 'Gamitin ang {tool} sa tatlong hakbang', stepTitles: ['Pumili ng mga file', 'Patakbuhin ang proseso', 'Suriin ang resulta'],
    select: 'Pumili ng mga suportadong file mula sa iyong device at idagdag sa workspace.', review: 'Buksan at suriin ang output bago ito gamitin.',
    questions: ['Ano ang ginagawa ng tool na ito?', 'Nababago ba ang orihinal na file?', 'Ilang file ang maaaring iproseso?', 'Anong mga limitasyon ang dapat malaman?', 'Saan pinoproseso ang mga file?', 'Dapat bang suriin ang output?'],
    source: 'Hindi. Gumagawa ito ng hiwalay na output file at hindi binabago ang orihinal.',
    multiple: ['Maaaring iproseso ang maraming PDF sa iisang setting at i-download bilang ZIP.', 'Sinusubukan ang mga PDF nang paisa-isa; inilalagay sa ZIP ang mga matagumpay.', 'Eksaktong dalawang PDF ang kailangan: orihinal muna, saka ang binagong kopya.', 'Maaaring magproseso ng maraming PPTX at i-download ang mga PDF bilang ZIP.'],
    browser: 'Sa browser ginagawa ang suportadong pagproseso ng dokumento. Maaari pa ring gumawa ng karaniwang network request ang page resources at mga naka-enable na third-party feature.',
    reviewAnswer: 'Oo. Suriin ang mahahalagang pahina at nilalaman at ihambing sa source kung kailangan.',
    operations: ['Binabago ang PDF CropBox gamit ang parehong porsiyento sa apat na gilid ng bawat pahina.', 'Muling sine-save ang PDF na nababasa pa ng parser at sinusuri ang parehong bilang ng pahina.', 'Inihahambing ang mapipiling teksto ng eksaktong dalawang PDF kada pahina.', 'Kinukuha ang teksto mula sa PPTX at inilalagay sa bagong payak na PDF page.'],
    limits: ['Hindi nabubura ang nilalaman sa labas ng CropBox; hindi ito secure redaction.', 'Hindi garantisado ang pag-recover at hindi maibabalik ang nawawala o naputol na nilalaman.', 'Hindi inihahambing ang larawan, layout, formatting o scanned text na walang OCR.', 'Hindi pinapanatili ang orihinal na larawan, layout, chart, theme, notes o animation.'],
  },
  es: {
    about: 'Cómo usar {tool}', stepsHeading: 'Usa {tool} en tres pasos', stepTitles: ['Selecciona archivos', 'Ejecuta el proceso', 'Revisa el resultado'],
    select: 'Elige archivos compatibles en tu dispositivo y añádelos al espacio de trabajo.', review: 'Abre y revisa el resultado antes de utilizarlo.',
    questions: ['¿Qué hace esta herramienta?', '¿Se modifica el archivo original?', '¿Cuántos archivos puedo procesar?', '¿Qué limitaciones debo conocer?', '¿Dónde se procesan los archivos?', '¿Debo revisar el resultado?'],
    source: 'No. El resultado se crea como un archivo separado y el original no cambia.',
    multiple: ['Puedes procesar varios PDF con el mismo ajuste y descargar los resultados en un ZIP.', 'Se intenta procesar cada PDF por separado; los resultados correctos se agrupan en un ZIP.', 'Se necesitan exactamente dos PDF: primero el original y luego la versión revisada.', 'Puedes procesar varios PPTX y descargar los PDF en un ZIP.'],
    browser: 'El procesamiento compatible se realiza en el navegador. Los recursos de la página y los servicios externos habilitados pueden generar solicitudes de red normales.',
    reviewAnswer: 'Sí. Revisa las páginas y el contenido importantes y compáralos con el original si hace falta.',
    operations: ['Cambia el CropBox del PDF con el mismo porcentaje en los cuatro lados de cada página.', 'Vuelve a guardar un PDF que el analizador puede leer y verifica que se abra con el mismo número de páginas.', 'Compara el texto seleccionable de dos PDF página por página.', 'Extrae texto de PPTX y lo coloca en nuevas páginas PDF básicas.'],
    limits: ['El contenido fuera del CropBox no se elimina; no es una redacción segura.', 'La recuperación no está garantizada y no puede recrear contenido ausente o truncado.', 'No compara imágenes, diseño, formato ni texto escaneado sin OCR.', 'No conserva imágenes, posiciones, gráficos, temas, notas ni animaciones originales.'],
  },
  it: {
    about: 'Come usare {tool}', stepsHeading: 'Usa {tool} in tre passaggi', stepTitles: ['Seleziona i file', 'Avvia l’elaborazione', 'Controlla il risultato'],
    select: 'Scegli i file supportati dal dispositivo e aggiungili all’area di lavoro.', review: 'Apri e controlla il risultato prima di utilizzarlo.',
    questions: ['Cosa fa questo strumento?', 'Il file originale viene modificato?', 'Quanti file posso elaborare?', 'Quali limiti devo conoscere?', 'Dove vengono elaborati i file?', 'È necessario controllare il risultato?'],
    source: 'No. Il risultato viene creato in un file separato e l’originale resta invariato.',
    multiple: ['Puoi elaborare più PDF con la stessa impostazione e scaricare i risultati in uno ZIP.', 'Ogni PDF viene provato separatamente; i risultati riusciti sono raccolti in uno ZIP.', 'Servono esattamente due PDF: prima l’originale, poi la versione rivista.', 'Puoi elaborare più PPTX e scaricare i PDF in uno ZIP.'],
    browser: 'L’elaborazione supportata avviene nel browser. Le risorse della pagina e i servizi di terze parti attivi possono effettuare normali richieste di rete.',
    reviewAnswer: 'Sì. Controlla le pagine e i contenuti importanti e confrontali con la fonte se necessario.',
    operations: ['Modifica il CropBox del PDF applicando la stessa percentuale ai quattro lati di ogni pagina.', 'Salva di nuovo un PDF leggibile dal parser e verifica che si riapra con lo stesso numero di pagine.', 'Confronta pagina per pagina il testo selezionabile di due PDF.', 'Estrae il testo dai PPTX e lo dispone su nuove pagine PDF di base.'],
    limits: ['Il contenuto fuori dal CropBox non viene eliminato; non è una redazione sicura.', 'Il recupero non è garantito e non ricrea contenuti mancanti o troncati.', 'Non confronta immagini, impaginazione, formattazione o testo scansionato senza OCR.', 'Non conserva immagini, posizioni, grafici, temi, note o animazioni originali.'],
  },
  no: {
    about: 'Slik bruker du {tool}', stepsHeading: 'Bruk {tool} i tre trinn', stepTitles: ['Velg filer', 'Kjør behandlingen', 'Kontroller resultatet'],
    select: 'Velg støttede filer fra enheten din og legg dem til i arbeidsområdet.', review: 'Åpne og kontroller resultatet før du bruker det.',
    questions: ['Hva gjør dette verktøyet?', 'Endres originalfilen?', 'Hvor mange filer kan behandles?', 'Hvilke begrensninger bør jeg kjenne til?', 'Hvor behandles filene?', 'Bør jeg kontrollere resultatet?'],
    source: 'Nei. Resultatet opprettes som en egen fil, og originalen endres ikke.',
    multiple: ['Flere PDF-filer kan behandles med samme innstilling og lastes ned som ZIP.', 'Flere PDF-filer prøves hver for seg; vellykkede resultater legges i en ZIP.', 'Nøyaktig to PDF-filer kreves: originalen først, deretter den reviderte kopien.', 'Flere PPTX-filer kan behandles og PDF-resultatene lastes ned som ZIP.'],
    browser: 'Støttet dokumentbehandling skjer i nettleseren. Sideressurser og aktiverte tredjepartstjenester kan fortsatt sende vanlige nettverksforespørsler.',
    reviewAnswer: 'Ja. Kontroller viktige sider og innhold, og sammenlign med kilden ved behov.',
    operations: ['Endrer PDF-filens CropBox med samme prosent på alle fire sider av hver side.', 'Lagrer en PDF som parseren kan lese på nytt og kontrollerer at samme sidetall åpnes.', 'Sammenligner markerbar tekst i to PDF-filer side for side.', 'Henter tekst fra PPTX og plasserer den på nye, enkle PDF-sider.'],
    limits: ['Innhold utenfor CropBox slettes ikke; dette er ikke sikker sladding.', 'Gjenoppretting er ikke garantert, og manglende eller avkuttet innhold kan ikke gjenskapes.', 'Bilder, layout, formatering og skannet tekst uten OCR sammenlignes ikke.', 'Originale bilder, plassering, diagrammer, temaer, notater og animasjoner beholdes ikke.'],
  },
  pt: {
    about: 'Como usar {tool}', stepsHeading: 'Use {tool} em três etapas', stepTitles: ['Escolha os arquivos', 'Execute o processo', 'Confira o resultado'],
    select: 'Escolha arquivos compatíveis no dispositivo e adicione-os ao espaço de trabalho.', review: 'Abra e confira o resultado antes de usá-lo.',
    questions: ['O que esta ferramenta faz?', 'O arquivo original é alterado?', 'Quantos arquivos posso processar?', 'Quais limitações devo conhecer?', 'Onde os arquivos são processados?', 'Devo verificar o resultado?'],
    source: 'Não. O resultado é criado em um arquivo separado e o original não é alterado.',
    multiple: ['É possível processar vários PDFs com a mesma configuração e baixar os resultados em ZIP.', 'Cada PDF é testado separadamente; os resultados bem-sucedidos são reunidos em ZIP.', 'São necessários exatamente dois PDFs: primeiro o original e depois a versão revisada.', 'É possível processar vários PPTX e baixar os PDFs em ZIP.'],
    browser: 'O processamento compatível ocorre no navegador. Recursos da página e serviços de terceiros ativados ainda podem fazer solicitações de rede comuns.',
    reviewAnswer: 'Sim. Confira páginas e conteúdos importantes e compare com a origem se necessário.',
    operations: ['Altera o CropBox do PDF com a mesma porcentagem nos quatro lados de cada página.', 'Salva novamente um PDF que o analisador consegue ler e verifica se abre com a mesma contagem de páginas.', 'Compara o texto selecionável de dois PDFs página por página.', 'Extrai texto do PPTX e o organiza em novas páginas PDF básicas.'],
    limits: ['O conteúdo fora do CropBox não é apagado; isso não é uma redação segura.', 'A recuperação não é garantida e não recria conteúdo ausente ou truncado.', 'Imagens, layout, formatação e texto digitalizado sem OCR não são comparados.', 'Imagens, posições, gráficos, temas, notas e animações originais não são preservados.'],
  },
  ru: {
    about: 'Как использовать {tool}', stepsHeading: 'Три шага для работы с {tool}', stepTitles: ['Выберите файлы', 'Запустите обработку', 'Проверьте результат'],
    select: 'Выберите поддерживаемые файлы на устройстве и добавьте их в рабочую область.', review: 'Откройте и проверьте результат перед использованием.',
    questions: ['Что делает этот инструмент?', 'Изменяется ли исходный файл?', 'Сколько файлов можно обработать?', 'Какие ограничения важно знать?', 'Где обрабатываются файлы?', 'Нужно ли проверять результат?'],
    source: 'Нет. Результат создается в отдельном файле, исходный файл не изменяется.',
    multiple: ['Несколько PDF можно обработать с одинаковыми настройками и скачать ZIP-архивом.', 'Каждый PDF проверяется отдельно; успешные результаты помещаются в ZIP.', 'Нужны ровно два PDF: сначала оригинал, затем измененная версия.', 'Можно обработать несколько PPTX и скачать PDF в ZIP-архиве.'],
    browser: 'Поддерживаемая обработка документов выполняется в браузере. Ресурсы страницы и включенные сторонние сервисы могут отправлять обычные сетевые запросы.',
    reviewAnswer: 'Да. Проверьте важные страницы и содержимое, при необходимости сравните с исходником.',
    operations: ['Изменяет CropBox PDF, применяя одинаковый процент ко всем четырем сторонам каждой страницы.', 'Повторно сохраняет читаемый парсером PDF и проверяет повторное открытие с тем же числом страниц.', 'Сравнивает выделяемый текст двух PDF постранично.', 'Извлекает текст PPTX и размещает его на новых простых страницах PDF.'],
    limits: ['Содержимое за пределами CropBox не удаляется; это не безопасное редактирование.', 'Восстановление не гарантируется; отсутствующее или усеченное содержимое нельзя воссоздать.', 'Изображения, макет, форматирование и текст сканов без OCR не сравниваются.', 'Исходные изображения, расположение, диаграммы, темы, заметки и анимация не сохраняются.'],
  },
  ko: {
    about: '{tool} 사용 방법', stepsHeading: '{tool} 사용 3단계', stepTitles: ['파일 선택', '처리 실행', '결과 확인'],
    select: '기기에서 지원되는 파일을 선택해 작업 영역에 추가하세요.', review: '사용하기 전에 출력 파일을 열어 내용을 확인하세요.',
    questions: ['이 도구는 무엇을 하나요?', '원본 파일이 변경되나요?', '한 번에 몇 개의 파일을 처리하나요?', '어떤 제한 사항을 알아야 하나요?', '파일은 어디에서 처리되나요?', '결과를 확인해야 하나요?'],
    source: '아니요. 결과는 별도 파일로 생성되며 원본은 변경되지 않습니다.',
    multiple: ['여러 PDF에 동일한 설정을 적용하고 결과를 ZIP으로 받을 수 있습니다.', '여러 PDF를 각각 처리하며 성공한 결과는 ZIP에 담깁니다.', '정확히 두 개의 PDF가 필요합니다. 원본을 먼저, 수정본을 다음에 선택하세요.', '여러 PPTX를 처리하고 PDF 결과를 ZIP으로 받을 수 있습니다.'],
    browser: '지원되는 문서 처리는 브라우저에서 실행됩니다. 페이지 리소스와 활성화된 타사 기능은 일반 네트워크 요청을 보낼 수 있습니다.',
    reviewAnswer: '예. 중요한 페이지와 내용을 확인하고 필요하면 원본과 비교하세요.',
    operations: ['모든 페이지의 네 면에 같은 비율을 적용해 PDF CropBox를 변경합니다.', '파서가 읽을 수 있는 PDF를 다시 저장하고 같은 페이지 수로 열리는지 확인합니다.', '두 PDF의 선택 가능한 텍스트를 페이지별로 비교합니다.', 'PPTX의 텍스트를 추출해 새 기본 PDF 페이지에 배치합니다.'],
    limits: ['CropBox 밖의 내용은 삭제되지 않습니다. 보안 redaction 기능이 아닙니다.', '복구를 보장하지 않으며 누락되거나 잘린 내용을 되살릴 수 없습니다.', '이미지, 레이아웃, 서식 및 OCR 전 스캔 텍스트는 비교하지 않습니다.', '원본 이미지, 배치, 차트, 테마, 노트 및 애니메이션은 보존되지 않습니다.'],
  },
  tr: {
    about: '{tool} nasıl kullanılır', stepsHeading: '{tool} için üç adım', stepTitles: ['Dosyaları seçin', 'İşlemi başlatın', 'Sonucu inceleyin'],
    select: 'Cihazınızdan desteklenen dosyaları seçip çalışma alanına ekleyin.', review: 'Kullanmadan önce çıktıyı açıp kontrol edin.',
    questions: ['Bu araç ne yapar?', 'Kaynak dosya değişir mi?', 'Kaç dosya işleyebilirim?', 'Hangi sınırlamaları bilmeliyim?', 'Dosyalar nerede işlenir?', 'Çıktıyı kontrol etmeli miyim?'],
    source: 'Hayır. Sonuç ayrı bir dosya olarak oluşturulur; kaynak dosya değiştirilmez.',
    multiple: ['Birden fazla PDF aynı ayarla işlenip ZIP olarak alınabilir.', 'Birden fazla PDF ayrı ayrı denenir; başarılı sonuçlar ZIP’e eklenir.', 'Tam olarak iki PDF gerekir: önce orijinal, sonra düzenlenmiş kopya.', 'Birden fazla PPTX işlenebilir ve PDF sonuçları ZIP olarak alınabilir.'],
    browser: 'Desteklenen belge işlemleri tarayıcıda yapılır. Sayfa kaynakları ve etkin üçüncü taraf hizmetleri olağan ağ istekleri gönderebilir.',
    reviewAnswer: 'Evet. Önemli sayfaları ve içeriği inceleyin; gerekirse kaynakla karşılaştırın.',
    operations: ['Her sayfanın dört kenarına aynı yüzdeyi uygulayarak PDF CropBox alanını değiştirir.', 'Ayrıştırıcının okuyabildiği PDF’yi yeniden kaydeder ve aynı sayfa sayısıyla açıldığını kontrol eder.', 'İki PDF’de seçilebilir metni sayfa sayfa karşılaştırır.', 'PPTX metnini çıkarıp yeni basit PDF sayfalarına yerleştirir.'],
    limits: ['CropBox dışındaki içerik silinmez; bu güvenli redaksiyon değildir.', 'Kurtarma garanti edilmez; eksik veya kesilmiş içerik yeniden oluşturulamaz.', 'Görseller, düzen, biçim ve OCR uygulanmamış tarama metni karşılaştırılmaz.', 'Özgün görseller, yerleşim, grafikler, temalar, notlar ve animasyonlar korunmaz.'],
  },
  nl: {
    about: 'Zo gebruik je {tool}', stepsHeading: '{tool} gebruiken in drie stappen', stepTitles: ['Bestanden kiezen', 'Verwerking starten', 'Resultaat controleren'],
    select: 'Kies ondersteunde bestanden op je apparaat en voeg ze toe aan de werkruimte.', review: 'Open en controleer de uitvoer voordat je die gebruikt.',
    questions: ['Wat doet deze tool?', 'Wordt het bronbestand gewijzigd?', 'Hoeveel bestanden kan ik verwerken?', 'Welke beperkingen moet ik kennen?', 'Waar worden bestanden verwerkt?', 'Moet ik het resultaat controleren?'],
    source: 'Nee. Het resultaat wordt als apart bestand gemaakt; het bronbestand blijft ongewijzigd.',
    multiple: ['Meerdere PDF’s kunnen met dezelfde instelling worden verwerkt en als ZIP worden opgeslagen.', 'PDF’s worden afzonderlijk geprobeerd; geslaagde resultaten komen in een ZIP.', 'Er zijn precies twee PDF’s nodig: eerst het origineel, daarna de herziene kopie.', 'Meerdere PPTX-bestanden kunnen worden verwerkt en de PDF’s als ZIP worden gedownload.'],
    browser: 'Ondersteunde documentverwerking gebeurt in de browser. Paginaresources en ingeschakelde diensten van derden kunnen gewone netwerkverzoeken doen.',
    reviewAnswer: 'Ja. Controleer belangrijke pagina’s en inhoud en vergelijk zo nodig met het bronbestand.',
    operations: ['Wijzigt de CropBox van de PDF met hetzelfde percentage aan alle vier zijden van elke pagina.', 'Slaat een leesbare PDF opnieuw op en controleert of die met hetzelfde aantal pagina’s opent.', 'Vergelijkt selecteerbare tekst uit twee PDF’s pagina voor pagina.', 'Haalt tekst uit PPTX en plaatst die op nieuwe eenvoudige PDF-pagina’s.'],
    limits: ['Inhoud buiten de CropBox wordt niet gewist; dit is geen veilige redactie.', 'Herstel is niet gegarandeerd en ontbrekende of afgebroken inhoud kan niet worden gemaakt.', 'Afbeeldingen, lay-out, opmaak en gescande tekst zonder OCR worden niet vergeleken.', 'Oorspronkelijke afbeeldingen, posities, grafieken, thema’s, notities en animaties blijven niet behouden.'],
  },
  pl: {
    about: 'Jak używać narzędzia {tool}', stepsHeading: 'Użyj {tool} w trzech krokach', stepTitles: ['Wybierz pliki', 'Uruchom przetwarzanie', 'Sprawdź wynik'],
    select: 'Wybierz obsługiwane pliki z urządzenia i dodaj je do obszaru roboczego.', review: 'Otwórz i sprawdź wynik przed użyciem.',
    questions: ['Co robi to narzędzie?', 'Czy plik źródłowy jest zmieniany?', 'Ile plików mogę przetworzyć?', 'Jakie ograniczenia warto znać?', 'Gdzie są przetwarzane pliki?', 'Czy należy sprawdzić wynik?'],
    source: 'Nie. Wynik powstaje w osobnym pliku, a plik źródłowy pozostaje bez zmian.',
    multiple: ['Można przetworzyć wiele plików PDF z tym samym ustawieniem i pobrać je jako ZIP.', 'Każdy PDF jest przetwarzany osobno; udane wyniki trafiają do ZIP.', 'Potrzebne są dokładnie dwa pliki PDF: najpierw oryginał, potem wersja po zmianach.', 'Można przetworzyć wiele PPTX i pobrać pliki PDF jako ZIP.'],
    browser: 'Obsługiwane przetwarzanie dokumentów odbywa się w przeglądarce. Zasoby strony i włączone usługi zewnętrzne mogą wykonywać zwykłe żądania sieciowe.',
    reviewAnswer: 'Tak. Sprawdź ważne strony i treść, a w razie potrzeby porównaj je z plikiem źródłowym.',
    operations: ['Zmienia CropBox pliku PDF, stosując ten sam procent do wszystkich czterech boków każdej strony.', 'Zapisuje ponownie plik PDF możliwy do odczytania i sprawdza, czy otwiera się z tą samą liczbą stron.', 'Porównuje zaznaczalny tekst z dwóch plików PDF strona po stronie.', 'Wyodrębnia tekst z PPTX i umieszcza go na nowych, podstawowych stronach PDF.'],
    limits: ['Treść poza CropBox nie jest usuwana; nie jest to bezpieczne redagowanie.', 'Odzyskiwanie nie jest gwarantowane i nie odtwarza brakującej ani uciętej treści.', 'Obrazy, układ, formatowanie i zeskanowany tekst bez OCR nie są porównywane.', 'Oryginalne obrazy, rozmieszczenie, wykresy, motywy, notatki i animacje nie są zachowywane.'],
  },
  sv: {
    about: 'Så använder du {tool}', stepsHeading: 'Använd {tool} i tre steg', stepTitles: ['Välj filer', 'Kör bearbetningen', 'Granska resultatet'],
    select: 'Välj filer som stöds från enheten och lägg till dem i arbetsytan.', review: 'Öppna och kontrollera resultatet innan du använder det.',
    questions: ['Vad gör verktyget?', 'Ändras originalfilen?', 'Hur många filer kan jag bearbeta?', 'Vilka begränsningar bör jag känna till?', 'Var bearbetas filerna?', 'Bör jag kontrollera resultatet?'],
    source: 'Nej. Resultatet skapas som en separat fil och originalet ändras inte.',
    multiple: ['Flera PDF-filer kan bearbetas med samma inställning och sparas som ZIP.', 'Flera PDF-filer provas var för sig; lyckade resultat läggs i en ZIP.', 'Exakt två PDF-filer krävs: originalet först och den reviderade kopian sedan.', 'Flera PPTX-filer kan bearbetas och PDF-resultaten hämtas som ZIP.'],
    browser: 'Dokumentbearbetning som stöds sker i webbläsaren. Sidresurser och aktiverade tredjepartstjänster kan göra vanliga nätverksanrop.',
    reviewAnswer: 'Ja. Kontrollera viktiga sidor och innehåll och jämför med källan vid behov.',
    operations: ['Ändrar PDF-filens CropBox med samma procent på alla fyra sidor av varje sida.', 'Sparar om en PDF som parsern kan läsa och kontrollerar att samma sidantal kan öppnas.', 'Jämför markerbar text i två PDF-filer sida för sida.', 'Hämtar text från PPTX och placerar den på nya enkla PDF-sidor.'],
    limits: ['Innehåll utanför CropBox tas inte bort; detta är inte säker redigering.', 'Återställning kan inte garanteras och saknat eller avklippt innehåll kan inte återskapas.', 'Bilder, layout, formatering och skannad text utan OCR jämförs inte.', 'Originalbilder, placeringar, diagram, teman, anteckningar och animeringar bevaras inte.'],
  },
  id: {
    about: 'Cara menggunakan {tool}', stepsHeading: 'Gunakan {tool} dalam tiga langkah', stepTitles: ['Pilih file', 'Jalankan proses', 'Periksa hasil'],
    select: 'Pilih file yang didukung dari perangkat lalu tambahkan ke ruang kerja.', review: 'Buka dan periksa hasil sebelum digunakan.',
    questions: ['Apa fungsi alat ini?', 'Apakah file sumber berubah?', 'Berapa file yang dapat diproses?', 'Batasan apa yang perlu diketahui?', 'Di mana file diproses?', 'Perlukah memeriksa hasilnya?'],
    source: 'Tidak. Hasil dibuat sebagai file terpisah dan file sumber tidak diubah.',
    multiple: ['Beberapa PDF dapat diproses dengan pengaturan sama dan diunduh sebagai ZIP.', 'Setiap PDF dicoba terpisah; hasil yang berhasil dimasukkan ke ZIP.', 'Tepat dua PDF diperlukan: pilih dokumen asli dahulu, lalu versi revisi.', 'Beberapa PPTX dapat diproses dan PDF hasilnya diunduh sebagai ZIP.'],
    browser: 'Pemrosesan dokumen yang didukung dilakukan di browser. Sumber daya halaman dan layanan pihak ketiga yang aktif tetap dapat membuat permintaan jaringan biasa.',
    reviewAnswer: 'Ya. Periksa halaman dan konten penting, lalu bandingkan dengan sumber bila perlu.',
    operations: ['Mengubah CropBox PDF dengan persentase sama pada keempat sisi setiap halaman.', 'Menyimpan ulang PDF yang dapat dibaca parser dan memeriksa apakah jumlah halamannya tetap sama.', 'Membandingkan teks yang dapat dipilih dari dua PDF halaman demi halaman.', 'Mengambil teks dari PPTX dan menyusunnya pada halaman PDF dasar yang baru.'],
    limits: ['Konten di luar CropBox tidak dihapus; ini bukan redaksi yang aman.', 'Pemulihan tidak dijamin dan konten hilang atau terpotong tidak dapat dibuat ulang.', 'Gambar, tata letak, format, dan teks pindai tanpa OCR tidak dibandingkan.', 'Gambar, tata letak, grafik, tema, catatan, dan animasi asli tidak dipertahankan.'],
  },
  vi: {
    about: 'Cách sử dụng {tool}', stepsHeading: 'Sử dụng {tool} trong ba bước', stepTitles: ['Chọn tệp', 'Chạy xử lý', 'Kiểm tra kết quả'],
    select: 'Chọn tệp được hỗ trợ trên thiết bị và thêm vào không gian làm việc.', review: 'Mở và kiểm tra đầu ra trước khi sử dụng.',
    questions: ['Công cụ này làm gì?', 'Tệp nguồn có bị thay đổi không?', 'Có thể xử lý bao nhiêu tệp?', 'Cần biết những giới hạn nào?', 'Tệp được xử lý ở đâu?', 'Có nên kiểm tra đầu ra không?'],
    source: 'Không. Kết quả được tạo thành tệp riêng và tệp nguồn không bị thay đổi.',
    multiple: ['Có thể xử lý nhiều PDF với cùng cài đặt và tải kết quả dưới dạng ZIP.', 'Mỗi PDF được thử riêng; kết quả thành công được đưa vào ZIP.', 'Cần đúng hai PDF: chọn bản gốc trước, sau đó chọn bản đã sửa đổi.', 'Có thể xử lý nhiều PPTX và tải các PDF dưới dạng ZIP.'],
    browser: 'Quá trình xử lý tài liệu được hỗ trợ chạy trong trình duyệt. Tài nguyên trang và dịch vụ bên thứ ba được bật vẫn có thể gửi yêu cầu mạng thông thường.',
    reviewAnswer: 'Có. Hãy kiểm tra các trang và nội dung quan trọng, rồi đối chiếu với tệp nguồn nếu cần.',
    operations: ['Thay đổi CropBox PDF bằng cùng một tỷ lệ ở cả bốn cạnh của mỗi trang.', 'Lưu lại PDF mà trình phân tích có thể đọc và kiểm tra khả năng mở với cùng số trang.', 'So sánh văn bản có thể chọn trong hai PDF theo từng trang.', 'Trích xuất văn bản PPTX và đặt vào các trang PDF cơ bản mới.'],
    limits: ['Nội dung ngoài CropBox không bị xóa; đây không phải thao tác biên tập bảo mật.', 'Không đảm bảo khôi phục và không thể tạo lại nội dung bị thiếu hoặc cắt cụt.', 'Không so sánh hình ảnh, bố cục, định dạng hoặc văn bản quét chưa OCR.', 'Không giữ lại hình ảnh, vị trí, biểu đồ, chủ đề, ghi chú và hoạt ảnh gốc.'],
  },
};

const content = JSON.parse(await readFile(contentPath, 'utf8'));
const qa = JSON.parse(await readFile(qaPath, 'utf8'));
const tools = await readActiveToolRegistry(appDir);
const publicToolIds = new Set(tools.map((tool) => tool.id));
const toolIds = candidateToolIds.filter((toolId) => publicToolIds.has(toolId));
const qaByPair = new Map(qa.entries.map((entry) => [`${entry.locale}:${entry.tool}`, entry]));
const localeIds = Object.keys(content).filter((locale) => locale !== 'en');

for (const locale of localeIds) {
  const localized = copy[locale];
  if (!localized) throw new Error(`Missing draft translation template for ${locale}.`);
  content[locale].tools ??= {};

  for (const toolId of toolIds) {
    const tool = tools.find((item) => item.id === toolId);
    if (!tool) throw new Error(`Public tool ${toolId} is missing from the registry.`);
    if (localized.operations.length !== 4 || localized.limits.length !== 4 || localized.multiple.length !== 4) {
      throw new Error(`Translation template for ${locale} does not cover all four tools.`);
    }
    const operationIndex = toolIds.indexOf(toolId);
    const title = tool.localizedTitles?.[locale]?.title || tool.toolLabel;
    const operation = localized.operations[operationIndex];
    const limitation = localized.limits[operationIndex];
    content[locale].tools[toolId] = {
      introHeading: localized.about.replace('{tool}', title),
      intro: `${operation} ${limitation}`,
      stepsHeading: localized.stepsHeading.replace('{tool}', title),
      steps: [
        { title: localized.stepTitles[0], description: localized.select },
        { title: localized.stepTitles[1], description: operation },
        { title: localized.stepTitles[2], description: localized.review },
      ],
      faqs: [
        { question: `${title}: ${localized.questions[0]}`, answer: operation },
        { question: `${title}: ${localized.questions[1]}`, answer: localized.source },
        { question: `${title}: ${localized.questions[2]}`, answer: localized.multiple[operationIndex] },
        { question: `${title}: ${localized.questions[3]}`, answer: limitation },
        { question: `${title}: ${localized.questions[4]}`, answer: localized.browser },
        { question: `${title}: ${localized.questions[5]}`, answer: localized.reviewAnswer },
      ],
    };
    qaByPair.set(`${locale}:${toolId}`, {
      tool: toolId,
      locale,
      status: 'generated_draft',
      humanReviewed: false,
      reviewer: null,
      contentCheckedAgainstToolBehavior: true,
    });
  }
}

qa.entries = [...qaByPair.values()].sort((left, right) =>
  left.tool.localeCompare(right.tool) || left.locale.localeCompare(right.locale),
);

await writeFile(contentPath, `${JSON.stringify(content, null, 2)}\n`);
await writeFile(qaPath, `${JSON.stringify(qa, null, 2)}\n`);
console.log(`Generated ${toolIds.length * localeIds.length} unreviewed tool SEO drafts across ${localeIds.length} locales.`);
