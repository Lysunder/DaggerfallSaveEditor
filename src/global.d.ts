import type { AddLocationResult, LoadResult, SaveLocation, SaveSlot } from '../electron/saveTypes';

export interface IpcRenderer {
  on(channel: string, listener: (...args: any[]) => void): this;
  off(channel: string, listener: (...args: any[]) => void): this;
  send(channel: string, ...args: any[]): void;
  invoke(channel: string, ...args: any[]): Promise<any>;
  openSaveData(): Promise<LoadResult>;
  saveData(filePath: string, data: any, factionData?: any): Promise<{ success: boolean; error?: string }>;

  // Save browser
  scanSaves(): Promise<{ locations: SaveLocation[]; saves: SaveSlot[] }>;
  addSaveInstall(): Promise<AddLocationResult>;
  addSaveFolder(): Promise<AddLocationResult>;
  removeSaveLocation(id: string): Promise<void>;
  getSaveScreenshot(folder: string): Promise<string | null>;
  loadSaveSlot(folder: string): Promise<LoadResult>;
}

declare global {
  /** App version from package.json, injected by Vite's `define`. */
  const __APP_VERSION__: string;

  interface Window {
    ipcRenderer: IpcRenderer;
  }
}
