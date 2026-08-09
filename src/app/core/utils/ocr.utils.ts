import * as Tesseract from 'tesseract.js';

export type OcrLanguage = 'eng' | 'chi_tra';

/**
 * Executes Optical Character Recognition (OCR) using Tesseract.js.
 * Supports multiple languages (concatenated with '+' internally).
 *
 * @param imageFile The image file or blob to recognize.
 * @param langs List of OCR languages to run (defaulting to English and Traditional Chinese).
 */
export async function runOcr(imageFile: File | Blob, langs: OcrLanguage[] = ['eng', 'chi_tra']): Promise<string> {
  const langString = langs.join('+');
  const ocrResult = await Tesseract.recognize(imageFile, langString);
  const ocrText = ocrResult.data.text;

  if (!ocrText || ocrText.trim() === '') {
    throw new Error(
      'OCR did not find any recognizable text in the receipt image. ' +
        'Please ensure the image has clear, legible text, and try again.',
    );
  }

  return ocrText;
}
