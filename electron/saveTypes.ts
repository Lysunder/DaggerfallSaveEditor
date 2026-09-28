// Types shared by the main process and the renderer (imported type-only from src/global.d.ts).

/** Contents of a DFU save folder's SaveInfo.txt (SaveInfo_v1). */
export interface SaveInfo {
  saveVersion: number;
  saveName: string;
  characterName: string;
  dateAndTime: { gameTime: number; realTime: number };
  dfuVersion?: string;
}

export type SaveLocationType = 'regular' | 'portable' | 'folder';

/** A place saves are read from, resolved to a saves root the way DFU would. */
export interface SaveLocation {
  /** Stable key, also used to remove a remembered location. */
  id: string;
  type: SaveLocationType;
  label: string;
  /** Resolved saves root, or null when the location can't be used right now. */
  root: string | null;
  /** Explains how the root was chosen, or why it's missing. */
  warning?: string;
  /** Regular location is auto-detected and can't be removed. */
  removable: boolean;
}

export interface SaveSlot {
  locationId: string;
  /** Absolute path of the SAVE<n> folder. */
  folder: string;
  folderName: string;
  index: number;
  info: SaveInfo | null;
  error?: string;
  hasScreenshot: boolean;
}

export interface LoadedSave {
  filePath: string;
  data: any;
  factionData: any;
  questData: any;
  notebookData: any;
  saveInfo: SaveInfo | null;
}

export type LoadResult =
  | ({ success: true } & LoadedSave)
  | { success: false; canceled?: boolean; error?: string };

export interface AddLocationResult {
  canceled?: boolean;
  location?: SaveLocation;
  /** Shown to the user, e.g. "This install isn't portable". */
  message?: string;
  error?: string;
}
