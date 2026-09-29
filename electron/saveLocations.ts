// Finds Daggerfall Unity save folders the same way DFU does.
// See SaveLoadManager.GetUnitySavePath, DaggerfallUnityApplication (portable mode) and
// SettingsManager.LoadSettings in the DFU source. Kept free of Electron so it can be unit tested.
import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import type { SaveInfo, SaveLocation, SaveSlot } from './saveTypes';

const COMPANY = 'Daggerfall Workshop';
const PRODUCT = 'Daggerfall Unity';
const PORTABLE_MARKER = 'Portable.txt';
const PORTABLE_APPDATA = 'PortableAppdata';
const SAVES_FOLDER = 'Saves';
const SAVE_INFO = 'SaveInfo.txt';
const SCREENSHOT = 'Screenshot.jpg';
const SAVE_FOLDER_PATTERN = /^SAVE(\d+)$/i;

export interface PlatformEnv {
  platform: NodeJS.Platform;
  homedir: string;
}

export const currentEnv = (): PlatformEnv => ({ platform: process.platform, homedir: os.homedir() });

/** Locations the user has added, stored in the editor's own settings file. */
export interface EditorSettings {
  /** Base directories of portable DFU installs. */
  portableInstalls: string[];
  /** Plain folders: a saves root, or a folder containing Saves/settings.ini. */
  folders: string[];
  /** A regular (non-portable) install, used to resolve a relative MyDaggerfallUnitySavePath. */
  regularInstallDir?: string;
}

export const emptySettings = (): EditorSettings => ({ portableInstalls: [], folders: [] });

const isDir = async (p: string) => (await fs.stat(p).catch(() => null))?.isDirectory() ?? false;
const isFile = async (p: string) => (await fs.stat(p).catch(() => null))?.isFile() ?? false;

/** Unity's Application.persistentDataPath for a regular DFU install. */
export const regularPersistentDir = (env: PlatformEnv): string => {
  switch (env.platform) {
    case 'win32':
      return path.join(env.homedir, 'AppData', 'LocalLow', COMPANY, PRODUCT);
    case 'darwin':
      return path.join(env.homedir, 'Library', 'Application Support', COMPANY, PRODUCT);
    default:
      return path.join(env.homedir, '.config', 'unity3d', COMPANY, PRODUCT);
  }
};

/**
 * MyDaggerfallUnitySavePath from [Daggerfall] in settings.ini. A distribution can rename the file
 * to settings_<suffix>.ini, so any settings*.ini is accepted, preferring plain settings.ini.
 */
export const readSaveSetting = async (persistentDir: string): Promise<string | undefined> => {
  const entries = await fs.readdir(persistentDir).catch(() => [] as string[]);
  const iniFiles = entries.filter((name) => /^settings(_[^.]+)?\.ini$/i.test(name));
  const iniFile = iniFiles.find((name) => name.toLowerCase() === 'settings.ini') ?? iniFiles[0];
  if (!iniFile) return undefined;

  const text = await fs.readFile(path.join(persistentDir, iniFile), 'utf-8').catch(() => '');
  let section = '';
  for (const rawLine of text.split(/\r?\n/)) {
    const line = rawLine.trim();
    const sectionMatch = line.match(/^\[(.+)\]$/);
    if (sectionMatch) {
      section = sectionMatch[1].trim().toLowerCase();
      continue;
    }
    const pair = line.match(/^([^=;#]+?)\s*=\s*(.*)$/);
    if (section === 'daggerfall' && pair && pair[1].toLowerCase() === 'mydaggerfallunitysavepath') {
      const value = pair[2].trim().replace(/^"(.*)"$/, '$1');
      return value || undefined;
    }
  }
  return undefined;
};

/**
 * Mirrors SaveLoadManager.GetUnitySavePath: MyDaggerfallUnitySavePath if it exists, otherwise
 * <persistentDir>/Saves. A relative setting is resolved against the install folder (portable mode
 * does this explicitly; a regular install resolves it against its working directory, normally the
 * install folder).
 */
export const resolveSaveRoot = async (
  persistentDir: string,
  installDir?: string,
): Promise<{ root: string | null; warning?: string }> => {
  if (!(await isDir(persistentDir))) {
    return { root: null, warning: `Folder not found: ${persistentDir}` };
  }

  const defaultRoot = path.join(persistentDir, SAVES_FOLDER);
  const setting = await readSaveSetting(persistentDir);
  if (!setting) return { root: defaultRoot };

  let candidate: string | undefined;
  let warning: string | undefined;
  if (path.isAbsolute(setting)) {
    candidate = setting;
  } else if (installDir) {
    candidate = path.resolve(installDir, setting);
  } else {
    warning = `settings.ini sets MyDaggerfallUnitySavePath to the relative path "${setting}". Add your Daggerfall Unity install folder so the editor can resolve it; showing the default save folder for now.`;
  }

  if (candidate) {
    if (await isDir(candidate)) return { root: candidate };
    warning = `The save folder set in settings.ini (${candidate}) doesn't exist, so Daggerfall Unity uses the default folder.`;
  }
  return { root: defaultRoot, warning };
};

/** Resolves a portable install's saves root from its base directory. */
export const resolvePortable = async (installDir: string): Promise<{ root: string | null; warning?: string }> => {
  if (!(await isDir(installDir))) {
    return { root: null, warning: `Install folder not found: ${installDir}` };
  }
  if (!(await isFile(path.join(installDir, PORTABLE_MARKER)))) {
    return { root: null, warning: `${PORTABLE_MARKER} is no longer in ${installDir}, so Daggerfall Unity doesn't keep its saves here.` };
  }
  return resolveSaveRoot(path.join(installDir, PORTABLE_APPDATA), installDir);
};

/**
 * Works out DFU's base directory from a folder the user picked, and whether it's a portable install.
 * AppDomain.BaseDirectory inside a macOS app bundle isn't confirmed, so several spots are checked.
 * Returns null if the folder doesn't look like a DFU install.
 */
export const findInstallBaseDir = async (picked: string): Promise<{ baseDir: string; portable: boolean } | null> => {
  const isBundle = picked.toLowerCase().endsWith('.app');
  const candidates = isBundle
    ? [
        path.dirname(picked),
        path.join(picked, 'Contents'),
        path.join(picked, 'Contents', 'MacOS'),
        path.join(picked, 'Contents', 'Resources', 'Data', 'Managed'),
      ]
    : [picked];

  for (const candidate of candidates) {
    if (await isFile(path.join(candidate, PORTABLE_MARKER))) return { baseDir: candidate, portable: true };
  }

  if (isBundle) return { baseDir: path.dirname(picked), portable: false };

  // Unity players ship a <Product>_Data folder next to the executable.
  const entries = await fs.readdir(picked, { withFileTypes: true }).catch(() => []);
  if (entries.some((entry) => entry.isDirectory() && entry.name.endsWith('_Data'))) {
    return { baseDir: picked, portable: false };
  }
  return null;
};

/** If a picked folder sits inside a portable install (e.g. its PortableAppdata or Saves folder), returns that install. */
export const findEnclosingPortableInstall = async (picked: string): Promise<string | null> => {
  let current = path.resolve(picked);
  for (let depth = 0; depth < 4; depth++) {
    if (await isFile(path.join(current, PORTABLE_MARKER))) return current;
    const parent = path.dirname(current);
    if (parent === current) break;
    current = parent;
  }
  return null;
};

const hasSaveFolders = async (dir: string) => {
  const entries = await fs.readdir(dir, { withFileTypes: true }).catch(() => []);
  return entries.some((entry) => entry.isDirectory() && SAVE_FOLDER_PATTERN.test(entry.name));
};

/**
 * Resolves a plain folder the user added: either a saves root itself, or a DFU data folder
 * (it contains Saves and/or settings.ini) whose settings are honoured.
 */
export const resolveFolder = async (dir: string): Promise<{ root: string | null; warning?: string }> => {
  if (!(await isDir(dir))) return { root: null, warning: `Folder not found: ${dir}` };
  if (await hasSaveFolders(dir)) return { root: dir };
  if ((await isDir(path.join(dir, SAVES_FOLDER))) || (await readSaveSetting(dir)) !== undefined) {
    return resolveSaveRoot(dir);
  }
  return { root: dir };
};

/** All save locations: the auto-detected regular one plus everything the user has added. */
export const resolveLocations = async (settings: EditorSettings, env: PlatformEnv): Promise<SaveLocation[]> => {
  const regularDir = regularPersistentDir(env);
  const regular = await resolveSaveRoot(regularDir, settings.regularInstallDir);
  const locations: SaveLocation[] = [
    {
      id: 'regular',
      type: 'regular',
      label: 'Default',
      removable: false,
      root: regular.root,
      warning: regular.root ? regular.warning : `Daggerfall Unity's default data folder wasn't found (${regularDir}).`,
    },
  ];

  for (const installDir of settings.portableInstalls) {
    const resolved = await resolvePortable(installDir);
    locations.push({
      id: `portable:${installDir}`,
      type: 'portable',
      label: `Portable – ${path.basename(installDir)}`,
      removable: true,
      ...resolved,
    });
  }

  for (const dir of settings.folders) {
    const resolved = await resolveFolder(dir);
    locations.push({ id: `folder:${dir}`, type: 'folder', label: `Folder – ${path.basename(dir)}`, removable: true, ...resolved });
  }

  return locations;
};

/** Mirrors SaveLoadManager.EnumerateSaveFolders: SAVE<n> folders that contain SaveInfo.txt. */
export const listSaves = async (location: SaveLocation): Promise<SaveSlot[]> => {
  if (!location.root) return [];
  const root = location.root;
  const entries = await fs.readdir(root, { withFileTypes: true }).catch(() => []);

  const slots = await Promise.all(
    entries.map(async (entry): Promise<SaveSlot | null> => {
      const match = entry.isDirectory() ? entry.name.match(SAVE_FOLDER_PATTERN) : null;
      if (!match) return null;
      const folder = path.join(root, entry.name);
      const infoPath = path.join(folder, SAVE_INFO);
      if (!(await isFile(infoPath))) return null;

      const base = {
        locationId: location.id,
        folder,
        folderName: entry.name,
        index: Number(match[1]),
        hasScreenshot: await isFile(path.join(folder, SCREENSHOT)),
      };
      try {
        const info = JSON.parse(await fs.readFile(infoPath, 'utf-8')) as SaveInfo;
        return { ...base, info };
      } catch (error) {
        return { ...base, info: null, error: `Couldn't read ${SAVE_INFO}: ${(error as Error).message}` };
      }
    }),
  );
  return slots.filter((slot): slot is SaveSlot => slot !== null);
};

/**
 * True if folder is a SAVE<n> folder directly inside one of the roots. Used to stop the renderer
 * from asking the main process to read arbitrary paths.
 */
export const isSaveFolderInRoots = (folder: string, roots: string[]): boolean => {
  const resolved = path.resolve(folder);
  return roots.some((root) => {
    const relative = path.relative(path.resolve(root), resolved);
    return !!relative && !path.isAbsolute(relative) && !relative.includes(path.sep) && SAVE_FOLDER_PATTERN.test(relative);
  });
};

export const screenshotPath = (folder: string) => path.join(folder, SCREENSHOT);

export const readSettingsFile = async (file: string): Promise<EditorSettings> => {
  try {
    const parsed = JSON.parse(await fs.readFile(file, 'utf-8'));
    return {
      portableInstalls: Array.isArray(parsed.portableInstalls) ? parsed.portableInstalls : [],
      folders: Array.isArray(parsed.folders) ? parsed.folders : [],
      regularInstallDir: typeof parsed.regularInstallDir === 'string' ? parsed.regularInstallDir : undefined,
    };
  } catch {
    return emptySettings();
  }
};

export const writeSettingsFile = async (file: string, settings: EditorSettings) => {
  await fs.mkdir(path.dirname(file), { recursive: true });
  await fs.writeFile(file, JSON.stringify(settings, null, 2), 'utf-8');
};
