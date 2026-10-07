import type { AddLocationResult, LoadResult, SaveLocation, SaveSlot } from '../electron/saveTypes';

export interface IpcRenderer {
  openSaveData(): Promise<LoadResult>;
  /** Writes only the files passed; pass null for data or omit factionData when unchanged. */
  saveData(filePath: string, data: any | null, factionData?: any): Promise<{ success: boolean; error?: string }>;

  // Save browser
  scanSaves(): Promise<{ locations: SaveLocation[]; saves: SaveSlot[] }>;
  addSaveInstall(): Promise<AddLocationResult>;
  addSaveFolder(): Promise<AddLocationResult>;
  removeSaveLocation(id: string): Promise<void>;
  getSaveScreenshot(folder: string): Promise<string | null>;
  loadSaveSlot(folder: string): Promise<LoadResult>;

  /** Puts text on the system clipboard (used to copy error reports). */
  copyText(text: string): Promise<void>;
}

declare global {
  /** App version from package.json, injected by Vite's `define`. */
  const __APP_VERSION__: string;

  interface Window {
    ipcRenderer: IpcRenderer;
  }
}
