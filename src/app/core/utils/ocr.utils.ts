import { createWorker } from 'tesseract.js';

export type OcrLanguage = 'eng' | 'chi_tra';

/**
 * Executes Optical Character Recognition (OCR) using Tesseract.js.
 * Configured to load language models locally for complete offline sandbox support.
 *
 * @param imageFile The image file, blob, or base64 string to recognize.
 * @param langs List of OCR languages to run (defaulting to English and Traditional Chinese).
 * @param win The injected Window instance from Angular.
 */
export async function runOcr(
  imageFile: File | Blob | string,
  langs: OcrLanguage[] = ['eng', 'chi_tra'],
  win: Window | null = null
): Promise<string> {
  const origin = win?.location?.origin || '';
  const langPath = origin ? `${origin}/assets/tessdata/` : '/assets/tessdata/';
  console.log('langPath', langPath);

  const worker = await createWorker(langs.join('+'), 1, {
    langPath,
    gzip: false,
    logger: m => console.log('[Tesseract Worker Status]', m),
  });

  const ocrResult = await worker.recognize(imageFile);
  await worker.terminate();

  const ocrText = ocrResult.data.text;

  if (!ocrText || ocrText.trim() === '') {
    throw new Error(
      'OCR did not find any recognizable text in the receipt image. ' +
        'Please ensure the image has clear, legible text, and try again.',
    );
  }

  return ocrText;
}
