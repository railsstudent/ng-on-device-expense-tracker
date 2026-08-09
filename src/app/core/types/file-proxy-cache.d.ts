/**
 * TypeScript typing definitions for Jason Mayes' FileProxyCache utility,
 * which is bundled and loaded globally in the browser context via angular.json.
 */
interface FileProxyCacheStatic {
  loadFromURL(url: string, progressCallback: (text: string) => void): Promise<string>;
  setCacheName(name: string): void;
  setShardSize(size: number): void;
  enableDebug(enabled: boolean): void;
}

declare const FileProxyCache: FileProxyCacheStatic;
