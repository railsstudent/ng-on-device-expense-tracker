import { Service, signal } from '@angular/core';

@Service()
export class SqliteService {
  private worker: Worker | null = null;
  #isConnected = signal(false);
  isConnected = this.#isConnected.asReadonly();
  private messageCallbacks = new Map<string, { resolve: (data: unknown) => void; reject: (err: unknown) => void }>();
  private messageIdCounter = 0;

  public async initialize(): Promise<void> {
    if (this.worker) {
      return;
    }

    return new Promise((resolve, reject) => {
      try {
        // Instantiate our custom worker using ES Modules
        this.worker = new Worker('/assets/sqlite-wasm/sqlite-custom-worker.js', { type: 'module' });

        this.worker.onmessage = (event) => {
          const { type, success, results, error, messageId } = event.data;

          if (messageId) {
            const callback = this.messageCallbacks.get(messageId);
            if (callback) {
              this.messageCallbacks.delete(messageId);
              if (success) {
                callback.resolve(results);
              } else {
                callback.reject(new Error(error));
              }
            }
          } else if (type === 'init') {
            if (success) {
              this.#isConnected.set(true);
              console.log('SQLite Custom Worker initialized successfully with OPFS SAH Pool!');
              resolve();
            } else {
              reject(new Error(error));
            }
          }
        };

        this.worker.onerror = (err) => {
          console.error('SQLite Worker Error:', err);
          reject(err);
        };

        // Send initialization request
        this.worker.postMessage({ type: 'init' });
      } catch (err) {
        reject(err);
      }
    });
  }

  public async exec(sql: string, bind?: unknown[] | Record<string, unknown>): Promise<unknown> {
    if (!this.worker) {
      throw new Error('SQLite Worker not initialized yet.');
    }

    return new Promise<unknown>((resolve, reject) => {
      const messageId = `msg#${++this.messageIdCounter}`;
      this.messageCallbacks.set(messageId, { resolve, reject });
      this.worker!.postMessage({ type: 'exec', sql, bind, messageId });
    });
  }
}
