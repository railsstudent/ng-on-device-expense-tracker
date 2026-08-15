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

  const worker = await createWorker(langs.join('+'), 1, { langPath, gzip: false });
  try {
    let ocrResult = await worker.recognize(processedCanvas || imageFile);
    let ocrText = ocrResult.data.text;

    // Graceful Multi-Pass Fallback: If OCR on the preprocessed canvas returned too little text (e.g. under 30 chars),
    // the contrast stretching or downscaling might have degraded or washed out characters.
    // Instantly retry OCR on the original raw image file to guarantee successful extraction!
    if (processedCanvas && (!ocrText || ocrText.trim().length < 30)) {
      console.warn('[runOcr] Insufficient text from canvas. Retrying raw...');
      ocrResult = await worker.recognize(imageFile);
      ocrText = ocrResult.data.text;
    }

    if (!ocrText || ocrText.trim() === '') {
      throw new Error('OCR did not find any recognizable text in the receipt image.');
    }
    return ocrText;
  } finally {
    await worker.terminate();
  }
}
