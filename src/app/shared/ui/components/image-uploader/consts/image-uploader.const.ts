/**
 * Maximum permitted size for dropped or selected receipt image files.
 * Enforces strict memory protection limits for on-device processing.
 */
export const MAX_IMAGE_SIZE_MB = 20;
export const SIZE_KB = 1024; // 1KB in bytes
export const SIZE_MB = SIZE_KB * SIZE_KB; // 1MB in bytes
export const MAX_IMAGE_SIZE_BYTES = MAX_IMAGE_SIZE_MB * SIZE_MB; // 20MB in bytes
