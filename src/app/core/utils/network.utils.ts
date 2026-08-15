import { signal, WritableSignal } from '@angular/core';

/**
 * Returns a static Signal tracking the browser's online connectivity status at load time.
 * Safely handles SSR and returns a simple signal without registering active event listeners.
 */
export function createOnlineStatusSignal(navigator: Navigator | null): WritableSignal<boolean> {
  const online = navigator ? navigator.onLine : true;
  return signal(online);
}
