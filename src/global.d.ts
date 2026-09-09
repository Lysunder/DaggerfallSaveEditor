export interface IpcRenderer {
  on(channel: string, listener: (...args: any[]) => void): this;
  off(channel: string, listener: (...args: any[]) => void): this;
  send(channel: string, ...args: any[]): void;
  invoke(channel: string, ...args: any[]): Promise<any>;
  openSaveData(): Promise<{ success: boolean; canceled?: boolean; filePath?: string; data?: any; factionData?: any; error?: string }>;
  saveData(filePath: string, data: any, factionData?: any): Promise<{ success: boolean; error?: string }>;
}

declare global {
  interface Window {
    ipcRenderer: IpcRenderer;
  }
}
