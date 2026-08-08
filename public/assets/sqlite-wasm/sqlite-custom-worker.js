import sqlite3InitModule from './index.mjs';

let db = null;

self.onmessage = async (event) => {
  const { type, sql, bind, messageId } = event.data;

  if (type === 'init') {
    try {
      const sqlite3 = await sqlite3InitModule({
        locateFile: (path) => `/assets/sqlite-wasm/${path}`
      });

      // Install the OPFS SAH Pool VFS.
      // This is the non-deprecated, modern way to persist SQLite database persistently in browsers
      // WITHOUT requiring SharedArrayBuffer, COOP/COEP headers, or browser isolation.
      const poolUtil = await sqlite3.installOpfsSAHPoolVfs({
        name: 'opfs-sahpool',
        initialCapacity: 6
      });

      db = new poolUtil.OpfsSAHPoolDb('/expenses_on_device.sqlite3');
      self.postMessage({ type: 'init', success: true, messageId });
    } catch (err) {
      self.postMessage({ type: 'init', success: false, error: err ? err.message || String(err) : 'Unknown error', messageId });
    }
  } else if (type === 'exec') {
    try {
      if (!db) throw new Error('Database not initialized.');
      const results = [];
      db.exec({
        sql,
        bind,
        rowMode: 'object',
        callback: (row) => {
          results.push(row);
        }
      });
      self.postMessage({ type: 'exec', success: true, results, messageId });
    } catch (err) {
      self.postMessage({ type: 'exec', success: false, error: err ? err.message || String(err) : 'Execution failed', messageId });
    }
  }
};
