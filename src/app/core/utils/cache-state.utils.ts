import { CacheState } from '@/shared/interfaces/cache-state.interface';

/**
 * Creates a state representing a fully cached model.
 */
export const createCachedState = (): CacheState => {
  return {
    status: 'cached',
    progress: 100,
  };
};

/**
 * Creates a state representing an active model download with progress.
 *
 * @param progress The download progress percentage (0-100).
 */
export const createDownloadingState = (progress: number): CacheState => {
  return {
    status: 'downloading',
    progress,
  };
};

/**
 * Creates a state representing a non-downloaded, initial model.
 */
export const createNotDownloadedState = (): CacheState => {
  return {
    status: 'not-downloaded',
    progress: 0,
  };
};
