import {
  PDFArray,
  PDFBool,
  PDFDict,
  PDFDocument,
  PDFHexString,
  PDFName,
  PDFNumber,
  PDFObjectCopier,
  PDFPage,
  PDFPageLeaf,
  PDFRef,
  PDFString,
} from 'pdf-lib';
import type { TranslationDict } from '../i18n/translations';

const ACRO_FORM = PDFName.of('AcroForm');
const FIELDS = PDFName.of('Fields');
const KIDS = PDFName.of('Kids');
const FIELD_TYPE = PDFName.of('FT');
const DEFAULT_APPEARANCE = PDFName.of('DA');
const DEFAULT_QUADDING = PDFName.of('Q');
const DEFAULT_RESOURCES = PDFName.of('DR');
const CALCULATION_ORDER = PDFName.of('CO');
const SIGNATURE_FLAGS = PDFName.of('SigFlags');
const NEED_APPEARANCES = PDFName.of('NeedAppearances');
const XFA = PDFName.of('XFA');

export interface MergePdfOptions {
  readFile?: (file: File) => Promise<ArrayBuffer>;
  yieldToMainThread?: (delayMs: number) => Promise<void>;
}

export type MergePdfErrorCode =
  | 'no-files'
  | 'unreadable-file'
  | 'input-memory'
  | 'unsupported-form'
  | 'dynamic-xfa'
  | 'digital-signature'
  | 'save-memory'
  | 'save-failed';

type MergePdfErrorTranslationKey = keyof Pick<TranslationDict,
  | 'mergePdfNoFilesError'
  | 'mergePdfUnreadableFileError'
  | 'mergePdfInputMemoryError'
  | 'mergePdfUnsupportedFormError'
  | 'mergePdfXfaError'
  | 'mergePdfSignatureError'
  | 'mergePdfSaveMemoryError'
  | 'mergePdfSaveError'
  | 'mergePdfGenericError'
>;

const MERGE_PDF_ERROR_TRANSLATION_KEYS: Record<MergePdfErrorCode, MergePdfErrorTranslationKey> = {
  'no-files': 'mergePdfNoFilesError',
  'unreadable-file': 'mergePdfUnreadableFileError',
  'input-memory': 'mergePdfInputMemoryError',
  'unsupported-form': 'mergePdfUnsupportedFormError',
  'dynamic-xfa': 'mergePdfXfaError',
  'digital-signature': 'mergePdfSignatureError',
  'save-memory': 'mergePdfSaveMemoryError',
  'save-failed': 'mergePdfSaveError',
};

type MergePdfErrorCopy = Pick<TranslationDict,
  | 'mergePdfNoFilesError'
  | 'mergePdfUnreadableFileError'
  | 'mergePdfInputMemoryError'
  | 'mergePdfUnsupportedFormError'
  | 'mergePdfXfaError'
  | 'mergePdfSignatureError'
  | 'mergePdfSaveMemoryError'
  | 'mergePdfSaveError'
  | 'mergePdfGenericError'
>;

export class MergePdfUserError extends Error {
  constructor(
    readonly mergePdfErrorCode: MergePdfErrorCode,
    message: string,
    readonly fileName?: string,
  ) {
    super(message);
    this.name = 'MergePdfUserError';
  }
}

class MergePdfSafetyError extends Error {
  constructor(
    readonly mergePdfErrorCode: 'unsupported-form' | 'dynamic-xfa' | 'digital-signature',
    message: string,
  ) {
    super(message);
  }
}

export function formatMergePdfErrorMessage(error: unknown, copy: MergePdfErrorCopy): string {
  const candidate = error && typeof error === 'object'
    ? error as { mergePdfErrorCode?: unknown; fileName?: unknown }
    : undefined;
  const code = candidate?.mergePdfErrorCode;

  if (typeof code === 'string' && code in MERGE_PDF_ERROR_TRANSLATION_KEYS) {
    const key = MERGE_PDF_ERROR_TRANSLATION_KEYS[code as MergePdfErrorCode];
    const template = copy[key];
    return template.replace('{fileName}', () => (
      typeof candidate?.fileName === 'string' ? candidate.fileName : ''
    ));
  }

  return isMemoryFailure(error) ? copy.mergePdfSaveMemoryError : copy.mergePdfGenericError;
}

function isMemoryFailure(error: unknown): boolean {
  const message = (error instanceof Error ? error.message : String(error || '')).toLowerCase();
  return error instanceof RangeError || /out of memory|allocation failed|array buffer|heap|maximum call stack|memory limit|cannot allocate|quota|exhausted/.test(message);
}

function inputError(file: File, error: unknown): Error {
  const prefix = `File ${JSON.stringify(file.name)}: `;
  if (error instanceof MergePdfSafetyError) {
    return new MergePdfUserError(error.mergePdfErrorCode, `${prefix}${error.message}`, file.name);
  }
  if (isMemoryFailure(error)) {
    return new MergePdfUserError(
      'input-memory',
      `${prefix}there is not enough available browser memory to process it. Try fewer or smaller PDFs, or close other tabs, then retry.`,
      file.name,
    );
  }
  return new MergePdfUserError(
    'unreadable-file',
    `${prefix}could not be read as a usable PDF. It may be damaged, incomplete, empty, or password-protected. Remove it or choose a valid, unlocked copy and retry.`,
    file.name,
  );
}

function formatPdfString(value: PDFString | PDFHexString, text: string): PDFString | PDFHexString {
  return value instanceof PDFHexString ? PDFHexString.fromText(text) : PDFString.of(text);
}

function getPdfText(value: unknown): { value: PDFString | PDFHexString; text: string } | undefined {
  if (value instanceof PDFString || value instanceof PDFHexString) {
    return { value, text: value.decodeText() };
  }
  return undefined;
}

function replaceAppearanceFontNames(
  appearance: string,
  renamedFonts: Map<string, string>,
): string {
  let result = appearance;
  for (const [sourceName, destinationName] of renamedFonts) {
    const escapedName = sourceName.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const fontReference = new RegExp(`/${escapedName}(?=\\s+[-+]?(?:\\d*\\.)?\\d+\\s+Tf\\b)`, 'g');
    result = result.replace(fontReference, `/${destinationName}`);
  }
  return result;
}

function getDictionary(context: PDFDocument['context'], value: unknown): PDFDict | undefined {
  if (value instanceof PDFDict) return value;
  if (value instanceof PDFRef) return context.lookupMaybe(value, PDFDict);
  return undefined;
}

function hasSignatureField(document: PDFDocument, form: PDFDict): boolean {
  const fields = form.lookupMaybe(FIELDS, PDFArray);
  if (!fields) return false;
  const visited = new Set<PDFDict>();
  const containsSignature = (value: unknown): boolean => {
    const field = getDictionary(document.context, value);
    if (!field || visited.has(field)) return false;
    visited.add(field);
    const fieldType = field.lookupMaybe(FIELD_TYPE, PDFName);
    if (fieldType?.decodeText() === 'Sig') return true;
    const kids = field.lookupMaybe(KIDS, PDFArray);
    if (!kids) return false;
    for (let index = 0; index < kids.size(); index += 1) {
      if (containsSignature(kids.get(index))) return true;
    }
    return false;
  };

  for (let index = 0; index < fields.size(); index += 1) {
    if (containsSignature(fields.get(index))) return true;
  }
  return false;
}

function mergeDefaultResources(
  output: PDFDocument,
  targetForm: PDFDict,
  incomingForm: PDFDict,
  sourceIndex: number,
): Map<string, string> {
  const incomingResources = incomingForm.lookupMaybe(DEFAULT_RESOURCES, PDFDict);
  if (!incomingResources) return new Map();

  let targetResources = targetForm.lookupMaybe(DEFAULT_RESOURCES, PDFDict);
  if (!targetResources) {
    targetResources = PDFDict.withContext(output.context);
    targetForm.set(DEFAULT_RESOURCES, targetResources);
  }

  const renamedFonts = new Map<string, string>();
  let fontIndex = 0;

  for (const [category, incomingValue] of incomingResources.entries()) {
    const categoryName = category.decodeText();
    if (categoryName === 'ProcSet' && incomingValue instanceof PDFArray) {
      let targetProcSet = targetResources.lookupMaybe(category, PDFArray);
      if (!targetProcSet) {
        targetProcSet = PDFArray.withContext(output.context);
        targetResources.set(category, targetProcSet);
      }
      for (const item of incomingValue.asArray()) {
        if (!targetProcSet.asArray().some((existing) => existing.toString() === item.toString())) {
          targetProcSet.push(item);
        }
      }
      continue;
    }

    const incomingCategory = getDictionary(output.context, incomingValue);
    if (!incomingCategory) {
      if (!targetResources.has(category)) targetResources.set(category, incomingValue);
      continue;
    }

    let targetCategory = targetResources.lookupMaybe(category, PDFDict);
    if (!targetCategory) {
      targetCategory = PDFDict.withContext(output.context);
      targetResources.set(category, targetCategory);
    }

    for (const [resourceName, resourceValue] of incomingCategory.entries()) {
      if (categoryName === 'Font') {
        let destinationName = `Merge${sourceIndex + 1}Font${fontIndex++}`;
        let destinationKey = PDFName.of(destinationName);
        while (targetCategory.has(destinationKey)) {
          destinationName = `Merge${sourceIndex + 1}Font${fontIndex++}`;
          destinationKey = PDFName.of(destinationName);
        }
        targetCategory.set(destinationKey, resourceValue);
        renamedFonts.set(resourceName.decodeText(), destinationName);
        continue;
      }

      if (!targetCategory.has(resourceName)) {
        targetCategory.set(resourceName, resourceValue);
        continue;
      }

      let suffix = 1;
      let destinationName = `Merge${sourceIndex + 1}_${resourceName.decodeText()}_${suffix}`;
      let destinationKey = PDFName.of(destinationName);
      while (targetCategory.has(destinationKey)) {
        suffix += 1;
        destinationName = `Merge${sourceIndex + 1}_${resourceName.decodeText()}_${suffix}`;
        destinationKey = PDFName.of(destinationName);
      }
      targetCategory.set(destinationKey, resourceValue);
    }
  }

  return renamedFonts;
}

function updateFieldAppearances(
  output: PDFDocument,
  field: PDFDict,
  defaultAppearance: { value: PDFString | PDFHexString; text: string } | undefined,
  defaultQuadding: unknown,
  renamedFonts: Map<string, string>,
  isRoot: boolean,
  visited: Set<PDFDict>,
): void {
  if (visited.has(field)) return;
  visited.add(field);

  const existingAppearance = getPdfText(field.get(DEFAULT_APPEARANCE));
  if (existingAppearance) {
    field.set(
      DEFAULT_APPEARANCE,
      formatPdfString(existingAppearance.value, replaceAppearanceFontNames(existingAppearance.text, renamedFonts)),
    );
  } else if (isRoot && defaultAppearance) {
    field.set(
      DEFAULT_APPEARANCE,
      formatPdfString(defaultAppearance.value, replaceAppearanceFontNames(defaultAppearance.text, renamedFonts)),
    );
  }

  if (isRoot && defaultQuadding !== undefined && !field.has(DEFAULT_QUADDING)) {
    field.set(DEFAULT_QUADDING, defaultQuadding as PDFNumber);
  }

  const kids = field.lookupMaybe(KIDS, PDFArray);
  if (!kids) return;
  for (let index = 0; index < kids.size(); index += 1) {
    const child = getDictionary(output.context, kids.get(index));
    if (child) updateFieldAppearances(output, child, defaultAppearance, defaultQuadding, renamedFonts, false, visited);
  }
}

function mergeAcroForm(
  output: PDFDocument,
  targetForm: PDFDict,
  incomingForm: PDFDict,
  sourceIndex: number,
): void {
  const renamedFonts = mergeDefaultResources(output, targetForm, incomingForm, sourceIndex);
  const incomingDefaultAppearance = getPdfText(incomingForm.get(DEFAULT_APPEARANCE));
  const incomingQuadding = incomingForm.get(DEFAULT_QUADDING);
  const incomingFields = incomingForm.lookupMaybe(FIELDS, PDFArray);

  if (incomingFields) {
    let targetFields = targetForm.lookupMaybe(FIELDS, PDFArray);
    if (!targetFields) {
      targetFields = PDFArray.withContext(output.context);
      targetForm.set(FIELDS, targetFields);
    }
    const visited = new Set<PDFDict>();
    for (let index = 0; index < incomingFields.size(); index += 1) {
      const fieldRef = incomingFields.get(index);
      const field = getDictionary(output.context, fieldRef);
      if (field) {
        updateFieldAppearances(output, field, incomingDefaultAppearance, incomingQuadding, renamedFonts, true, visited);
      }
      targetFields.push(fieldRef);
    }
  }

  const incomingCalculationOrder = incomingForm.lookupMaybe(CALCULATION_ORDER, PDFArray);
  if (incomingCalculationOrder) {
    let targetCalculationOrder = targetForm.lookupMaybe(CALCULATION_ORDER, PDFArray);
    if (!targetCalculationOrder) {
      targetCalculationOrder = PDFArray.withContext(output.context);
      targetForm.set(CALCULATION_ORDER, targetCalculationOrder);
    }
    for (let index = 0; index < incomingCalculationOrder.size(); index += 1) {
      targetCalculationOrder.push(incomingCalculationOrder.get(index));
    }
  }

  const incomingSignatureFlags = incomingForm.lookupMaybe(SIGNATURE_FLAGS, PDFNumber);
  if (incomingSignatureFlags) {
    const current = targetForm.lookupMaybe(SIGNATURE_FLAGS, PDFNumber)?.asNumber() ?? 0;
    targetForm.set(SIGNATURE_FLAGS, PDFNumber.of(current | incomingSignatureFlags.asNumber()));
  }

  const needAppearances = targetForm.lookupMaybe(NEED_APPEARANCES, PDFBool)?.asBoolean()
    || incomingForm.lookupMaybe(NEED_APPEARANCES, PDFBool)?.asBoolean();
  if (needAppearances) targetForm.set(NEED_APPEARANCES, PDFBool.True);

  const mergedKeys = new Set([
    FIELDS.toString(),
    DEFAULT_APPEARANCE.toString(),
    DEFAULT_QUADDING.toString(),
    DEFAULT_RESOURCES.toString(),
    CALCULATION_ORDER.toString(),
    SIGNATURE_FLAGS.toString(),
    NEED_APPEARANCES.toString(),
  ]);
  for (const [key, value] of incomingForm.entries()) {
    if (!mergedKeys.has(key.toString()) && !targetForm.has(key)) targetForm.set(key, value);
  }
}

function makeFieldNamesUnique(
  source: PDFDocument,
  sourceIndex: number,
  usedNames: Set<string>,
): void {
  const sourceForm = source.catalog.AcroForm();
  if (!sourceForm) return;

  let fields;
  try {
    fields = source.getForm().getFields();
  } catch {
    throw new MergePdfSafetyError(
      'unsupported-form',
      'contains interactive form data that cannot be safely preserved. No merged output was created. Use a compatible PDF export and retry.',
    );
  }

  for (const field of fields) {
    if (field.constructor.name === 'PDFSignature') {
      throw new MergePdfSafetyError(
        'digital-signature',
        'contains a digital signature. Merging changes the signed bytes, so that signature cannot remain valid. Use an unsigned copy.',
      );
    }

    const originalName = field.getName();
    let uniqueName = originalName;
    if (usedNames.has(uniqueName)) {
      // Keep the first field name; suffix only later collisions, preserving the shared field tree and widgets.
      const partialName = field.acroField.getPartialName() || originalName.split('.').pop() || 'Field';
      let suffix = 1;
      do {
        const updatedPartialName = `${partialName}__merged${sourceIndex + 1}_${suffix++}`;
        uniqueName = originalName.includes('.')
          ? `${originalName.slice(0, originalName.lastIndexOf('.') + 1)}${updatedPartialName}`
          : updatedPartialName;
      } while (usedNames.has(uniqueName));
      field.acroField.setPartialName(uniqueName.includes('.') ? uniqueName.slice(uniqueName.lastIndexOf('.') + 1) : uniqueName);
    }
    usedNames.add(uniqueName);
  }
}

function copyMeaningfulMetadata(
  source: PDFDocument,
  output: PDFDocument,
  copied: Set<string>,
): void {
  // First non-empty value in selected-file order wins per metadata field; absent values are never fabricated.
  const fields: Array<[string, string | undefined, (value: string) => void]> = [
    ['title', source.getTitle(), output.setTitle.bind(output)],
    ['author', source.getAuthor(), output.setAuthor.bind(output)],
    ['subject', source.getSubject(), output.setSubject.bind(output)],
    ['keywords', source.getKeywords(), (value) => output.setKeywords([value])],
    ['creator', source.getCreator(), output.setCreator.bind(output)],
    ['producer', source.getProducer(), output.setProducer.bind(output)],
  ];

  for (const [key, value, setValue] of fields) {
    if (!copied.has(key) && value?.trim()) {
      setValue(value);
      copied.add(key);
    }
  }

  const creationDate = source.getCreationDate();
  if (!copied.has('creationDate') && creationDate) {
    output.setCreationDate(creationDate);
    copied.add('creationDate');
  }
  const modificationDate = source.getModificationDate();
  if (!copied.has('modificationDate') && modificationDate) {
    output.setModificationDate(modificationDate);
    copied.add('modificationDate');
  }
}

function safeSaveError(error: unknown): Error {
  if (isMemoryFailure(error)) {
    return new MergePdfUserError(
      'save-memory',
      'The merged PDF could not be saved because available browser memory is insufficient. Try fewer or smaller PDFs, then retry.',
    );
  }
  return new MergePdfUserError(
    'save-failed',
    'The combined PDF could not be saved. Your selected files are still available; try again or use fewer PDFs.',
  );
}

export async function mergePdfDocuments(
  files: File[],
  onProgress?: (current: number, total: number) => void,
  options: MergePdfOptions = {},
): Promise<Uint8Array> {
  if (files.length === 0) {
    throw new MergePdfUserError('no-files', 'Select at least one PDF file before merging.');
  }

  const output = await PDFDocument.create({ updateMetadata: false });
  const usedFieldNames = new Set<string>();
  const copiedMetadata = new Set<string>();
  let mergedAcroForm: PDFDict | undefined;

  for (let fileIndex = 0; fileIndex < files.length; fileIndex += 1) {
    const file = files[fileIndex];
    try {
      if (!file.size) throw new Error('empty input');
      const inputBytes = await (options.readFile || ((selectedFile) => selectedFile.arrayBuffer()))(file);
      const source = await PDFDocument.load(inputBytes, {
        ignoreEncryption: false,
        updateMetadata: false,
      });
      if (source.getPageCount() === 0) throw new Error('PDF contains no pages');

      const sourceAcroForm = source.catalog.AcroForm();
      if (sourceAcroForm?.has(XFA)) {
        throw new MergePdfSafetyError(
          'dynamic-xfa',
          'contains a dynamic XFA form that this merger cannot safely preserve. Export a static PDF copy and retry.',
        );
      }
      if (sourceAcroForm && hasSignatureField(source, sourceAcroForm)) {
        throw new MergePdfSafetyError(
          'digital-signature',
          'contains a digital signature. Merging changes the signed bytes, so that signature cannot remain valid. Use an unsigned copy.',
        );
      }
      makeFieldNamesUnique(source, fileIndex, usedFieldNames);

      await source.flush();
      const copier = PDFObjectCopier.for(source.context, output.context);
      const sourcePages = source.getPages();
      for (let pageIndex = 0; pageIndex < sourcePages.length; pageIndex += 1) {
        const copiedPage = copier.copy(sourcePages[pageIndex].node) as PDFPageLeaf;
        const pageRef = output.context.register(copiedPage);
        output.addPage(PDFPage.of(copiedPage, pageRef, output));
        if (pageIndex > 0 && pageIndex % 25 === 0) {
          await options.yieldToMainThread?.(0);
        }
      }

      if (sourceAcroForm) {
        const copiedForm = copier.copy(sourceAcroForm) as PDFDict;
        if (!mergedAcroForm) {
          mergedAcroForm = copiedForm;
          output.catalog.set(ACRO_FORM, copiedForm);
        } else {
          mergeAcroForm(output, mergedAcroForm, copiedForm, fileIndex);
        }
      }

      copyMeaningfulMetadata(source, output, copiedMetadata);
    } catch (error) {
      throw inputError(file, error);
    }

    onProgress?.(fileIndex + 1, files.length);
    await options.yieldToMainThread?.(40);
  }

  try {
    return await output.save({
      useObjectStreams: true,
      updateFieldAppearances: false,
      objectsPerTick: 25,
    });
  } catch (error) {
    throw safeSaveError(error);
  }
}
