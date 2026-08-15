import { SIZE_KB, SIZE_MB } from '../consts/image-uploader.const';

export function calculateFileSize(file: File) {
  const sizeInMb = file.size / SIZE_MB;
  const sizeText = sizeInMb >= 0.1 ? `${sizeInMb.toFixed(2)} MB` : `${(file.size / SIZE_KB).toFixed(1)} KB`;
  return sizeText;
}
