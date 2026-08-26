import { describe, expect, it } from 'vitest';
import { calculateFileSize } from './file.utils';
import { SIZE_KB, SIZE_MB } from '@/shared/ui/components/image-uploader/consts/image-uploader.const';

describe('file.utils', () => {
  it('should format bytes below 0.1MB into KB', () => {
    const mockFile = new File([''], 'test.png', { type: 'image/png' });
    Object.defineProperty(mockFile, 'size', { value: 45 * SIZE_KB });
    expect(calculateFileSize(mockFile)).toBe('45.0 KB');
  });

  it('should format bytes above 0.1MB into MB', () => {
    const mockFile = new File([''], 'test.png', { type: 'image/png' });
    Object.defineProperty(mockFile, 'size', { value: 2.35 * SIZE_MB });
    expect(calculateFileSize(mockFile)).toBe('2.35 MB');
  });
});
