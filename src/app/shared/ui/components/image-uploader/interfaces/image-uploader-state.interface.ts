/**
 * Defines the state configuration structure for the Image Uploader component.
 * Supports fluid, optional transitions across preview, progress, and validation boundaries.
 */
export interface ImageUploaderState {
  preview?: string;
  progress?: number;
  error?: string;
  sizeText?: string;
}
