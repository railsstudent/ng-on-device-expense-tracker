import { describe, it, expect, vi, beforeEach } from 'vitest';
import { runOcr } from './ocr.utils';

const mockRecognize = vi.fn();
const mockTerminate = vi.fn();
const mockCreateWorker = vi.fn().mockResolvedValue({
  recognize: mockRecognize,
  terminate: mockTerminate,
});

vi.mock('tesseract.js', () => {
  return {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    createWorker: (...args: any[]) => mockCreateWorker(...args),
  };
});

describe('ocrUtils', () => {
  const dummyBlob = new Blob(['test-image-content'], { type: 'image/png' });

  beforeEach(() => {
    vi.clearAllMocks();
    mockCreateWorker.mockResolvedValue({
      recognize: mockRecognize,
      terminate: mockTerminate,
    });
  });

  it('should successfully create worker and recognize text', async () => {
    const mockText = '   Standard Receipt Text  \n  Total: $100  ';
    mockRecognize.mockResolvedValue({
      data: { text: mockText },
    });

    const result = await runOcr(dummyBlob);

    expect(mockCreateWorker).toHaveBeenCalledWith('eng+chi_tra+chi_sim', 1, expect.any(Object));
    expect(mockRecognize).toHaveBeenCalledWith(dummyBlob);
    expect(mockTerminate).toHaveBeenCalled();
    expect(result).toBe(mockText);
  });

  it('should successfully support custom languages if passed as an array argument', async () => {
    const mockText = 'Traditional Chinese Text';
    mockRecognize.mockResolvedValue({
      data: { text: mockText },
    });

    const result = await runOcr(dummyBlob, ['chi_tra']);

    expect(mockCreateWorker).toHaveBeenCalledWith('chi_tra', 1, expect.any(Object));
    expect(mockRecognize).toHaveBeenCalledWith(dummyBlob);
    expect(mockTerminate).toHaveBeenCalled();
    expect(result).toBe(mockText);
  });

  it('should throw a detailed error if Tesseract returns an empty or whitespace-only text string', async () => {
    mockRecognize.mockResolvedValue({
      data: { text: '   \n   ' },
    });

    await expect(runOcr(dummyBlob)).rejects.toThrow('OCR did not find any recognizable text in the receipt image.');
    expect(mockTerminate).toHaveBeenCalled();
  });

  it('should propagate errors directly if Tesseract.recognize rejects or throws', async () => {
    const testError = new Error('Tesseract library loading failed');
    mockRecognize.mockRejectedValue(testError);

    await expect(runOcr(dummyBlob)).rejects.toThrow('Tesseract library loading failed');
  });

  it('should successfully use custom langPath if passed as third parameter', async () => {
    const mockText = 'Test Text';
    mockRecognize.mockResolvedValue({
      data: { text: mockText },
    });

    await runOcr(dummyBlob, ['eng'], 'http://localhost:4200/assets/tessdata/');

    expect(mockCreateWorker).toHaveBeenCalledWith(
      'eng',
      1,
      expect.objectContaining({
        langPath: 'http://localhost:4200/assets/tessdata/',
      }),
    );
  });
});
