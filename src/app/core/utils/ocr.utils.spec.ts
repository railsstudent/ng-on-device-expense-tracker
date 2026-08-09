import { describe, it, expect, vi, beforeEach } from 'vitest';
import * as Tesseract from 'tesseract.js';
import { runOcr } from './ocr.utils';

vi.mock('tesseract.js', () => {
  return {
    recognize: vi.fn(),
  };
});

describe('ocrUtils', () => {
  const dummyBlob = new Blob(['test-image-content'], { type: 'image/png' });

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should successfully call Tesseract.recognize with the default languages and return text', async () => {
    const mockText = '   Standard Receipt Text  \n  Total: $100  ';
    vi.mocked(Tesseract.recognize).mockResolvedValue({
      data: { text: mockText },
    } as unknown as Tesseract.RecognizeResult);

    const result = await runOcr(dummyBlob);

    expect(Tesseract.recognize).toHaveBeenCalledWith(dummyBlob, 'eng+chi_tra');
    expect(result).toBe(mockText);
  });

  it('should successfully support custom languages if passed as an array argument', async () => {
    const mockText = 'Traditional Chinese Text';
    vi.mocked(Tesseract.recognize).mockResolvedValue({
      data: { text: mockText },
    } as unknown as Tesseract.RecognizeResult);

    const result = await runOcr(dummyBlob, ['chi_tra']);

    expect(Tesseract.recognize).toHaveBeenCalledWith(dummyBlob, 'chi_tra');
    expect(result).toBe(mockText);
  });

  it('should throw a detailed error if Tesseract returns an empty or whitespace-only text string', async () => {
    vi.mocked(Tesseract.recognize).mockResolvedValue({
      data: { text: '   \n   ' },
    } as unknown as Tesseract.RecognizeResult);

    await expect(runOcr(dummyBlob)).rejects.toThrow('OCR did not find any recognizable text in the receipt image.');
  });

  it('should propagate errors directly if Tesseract.recognize rejects or throws', async () => {
    const testError = new Error('Tesseract library loading failed');
    vi.mocked(Tesseract.recognize).mockRejectedValue(testError);

    await expect(runOcr(dummyBlob)).rejects.toThrow('Tesseract library loading failed');
  });
});
