import { createWorker } from 'tesseract.js';
import { processImageInCanvas } from '@/core/utils/image.utils';

export type OcrLanguage = 'eng' | 'chi_tra' | 'chi_sim';

/**
 * First private helper function: Construct the image URL from imageFile input.
 */
function constructImageUrl(imageFile: File | Blob | string): { imageUrl: string; shouldRevoke: boolean } {
  if (typeof imageFile === 'string') {
    return { imageUrl: imageFile, shouldRevoke: false };
  }
  return { imageUrl: URL.createObjectURL(imageFile), shouldRevoke: true };
}

/**
 * Executes Optical Character Recognition (OCR) using Tesseract.js.
 * Stays strictly under 40 lines.
 */
export async function runOcr(
  imageFile: File | Blob | string,
  langs: OcrLanguage[] = ['eng', 'chi_tra', 'chi_sim'],
  langPath = '/assets/tessdata/',
  doc?: Document,
): Promise<string> {
  const { imageUrl, shouldRevoke } = constructImageUrl(imageFile);
  const processedCanvas = await (async () => {
    try {
      return await processImageInCanvas(imageUrl, doc);
    } finally {
      if (shouldRevoke) {
        URL.revokeObjectURL(imageUrl);
      }
    }
  })();

  const worker = await createWorker(langs.join('+'), 1, {
    langPath,
    gzip: false,
    logger: (m) => console.log('[Tesseract Worker Status]', m),
  });

  const sourceToRecognize = processedCanvas || imageFile;
  const ocrResult = await worker.recognize(sourceToRecognize);
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
