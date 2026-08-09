import { CacheStatus } from './cache-status.interface';

export interface CacheState {
  status: CacheStatus;
  progress: number;
}
