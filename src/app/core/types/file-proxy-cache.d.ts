declare module '@/assets/FileProxyCache.min.js' {
  interface FileProxyCacheStatic {
    loadFromURL(url: string, progressCallback?: (text: string) => void): Promise<string>;
    setCacheName(name: string): void;
    setShardSize(size: number): void;
    enableDebug(enabled: boolean): void;
  }
  const FileProxyCache: FileProxyCacheStatic;
  export default FileProxyCache;
}
