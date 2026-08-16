export type AiSessionStatus = 'idle' | 'initializing' | 'priming' | 'thinking' | 'ready' | 'failed';

export interface AiSessionState {
  status: AiSessionStatus;
  error?: string;
}
