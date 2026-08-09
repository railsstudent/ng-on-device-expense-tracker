import { Service, signal } from '@angular/core';
import { drizzle, SqliteRemoteDatabase } from 'drizzle-orm/sqlite-proxy';
import * as schema from '../../shared/db/schema';

@Service()
export class SqliteService {
  private worker: Worker | null = null;
  #isConnected = signal(false);
  isConnected = this.#isConnected.asReadonly();

  // Private Drizzle database client
  #db: SqliteRemoteDatabase<typeof schema> | null = null;

  private messageCallbacks = new Map<string, { resolve: (data: unknown) => void; reject: (err: unknown) => void }>();
  private messageIdCounter = 0;

  /**
   * Safe public getter to access Drizzle DB instance
   */
  public get db(): SqliteRemoteDatabase<typeof schema> {
    if (!this.#db) {
      throw new Error(
        'SQLite Database and Drizzle ORM have not been initialized yet. ' +
          'Please ensure you await sqliteService.initialize() during application startup.',
      );
    }
    return this.#db;
  }

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
              // Initialize Drizzle ORM using sqlite-proxy once worker connects
              this.#db = drizzle(
                async (sql, params, method) => {
                  const results = (await this.exec(sql, params)) as Record<string, unknown>[];

                  if (!results || !Array.isArray(results)) {
                    return { rows: [] };
                  }

                  if (method === 'get') {
                    const firstRow = results[0];
                    return { rows: firstRow ? Object.values(firstRow) : [] };
                  }

                  const rows = results.map((row) => Object.values(row));
                  return { rows };
                },
                { schema },
              );

              // Auto-provision tables on start-up
              this.exec(
                `
                CREATE TABLE IF NOT EXISTS expenses (
                  id INTEGER PRIMARY KEY AUTOINCREMENT,
                  merchant_name TEXT NOT NULL,
                  amount REAL NOT NULL,
                  transaction_date TEXT NOT NULL,
                  category TEXT NOT NULL
                );
              `,
              )
                .then(() => {
                  this.#isConnected.set(true);
                  console.log('SQLite Custom Worker and Drizzle initialized successfully!');
                  resolve();
                })
                .catch((err) => reject(err));
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
