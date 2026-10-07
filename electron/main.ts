import { app, BrowserWindow, ipcMain, dialog, shell, clipboard } from 'electron';
import path from 'node:path';
import fs from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import {
  currentEnv,
  findEnclosingPortableInstall,
  findInstallBaseDir,
  isSaveFolderInRoots,
  listSaves,
  readSettingsFile,
  resolveLocations,
  screenshotPath,
  writeSettingsFile,
} from './saveLocations';
import type { AddLocationResult, LoadResult } from './saveTypes';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// The built directory structure
//
// ├─┬─┬ dist
// │ │ └── index.html
// │ │
// │ ├─┬ dist-electron
// │ │ ├── main.js
// │ │ └── preload.js
// │
process.env.DIST = path.join(__dirname, '../dist');
process.env.VITE_PUBLIC = app.isPackaged ? process.env.DIST : path.join(process.env.DIST, '../public');

let win: BrowserWindow | null;
const VITE_DEV_SERVER_URL = process.env['VITE_DEV_SERVER_URL'];

function createWindow() {
  win = new BrowserWindow({
    width: 1200,
    height: 800,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      sandbox: true,
      nodeIntegration: false,
    },
  });

  win.setMenu(null);

  // Open external links (e.g. UESP quest pages) in the system browser instead of a new app window.
  win.webContents.setWindowOpenHandler(({ url }) => {
    if (url.startsWith('https://')) {
      shell.openExternal(url);
    }
    return { action: 'deny' };
  });

  // The renderer blocks unload (beforeunload) while there are unsaved changes; ask before closing.
  win.webContents.on('will-prevent-unload', (event) => {
    const choice = dialog.showMessageBoxSync(win!, {
      type: 'warning',
      title: 'Unsaved changes',
      message: 'You have unsaved changes to this save.',
      detail: 'Quit without saving them? To keep them, choose Cancel and save first.',
      buttons: ['Quit without saving', 'Cancel'],
      defaultId: 1,
      cancelId: 1,
    });
    if (choice === 0) {
      event.preventDefault(); // lets the unload go ahead
    }
  });

  // A crashed or killed renderer leaves a blank window with no way to report what happened.
  win.webContents.on('render-process-gone', (_event, details) => {
    void reportRendererGone(details);
  });

  // A hang (e.g. an endless loop) also looks like a frozen window; let the user get out of it.
  win.on('unresponsive', async () => {
    if (!win) return;
    const { response } = await dialog.showMessageBox(win, {
      type: 'warning',
      title: 'The editor is not responding',
      message: 'The editor window has stopped responding.',
      detail: 'You can wait for it, or reload it (unsaved changes will be lost). If this keeps happening, please report what you were doing when it froze.',
      buttons: ['Wait', 'Reload'],
      defaultId: 0,
      cancelId: 0,
      noLink: true,
    });
    if (response === 1) {
      // Electron's documented way to recover a hung renderer: kill it, then reload.
      killingHungRenderer = true;
      win.webContents.forcefullyCrashRenderer();
      win.webContents.reload();
    }
  });

  if (VITE_DEV_SERVER_URL) {
    win.loadURL(VITE_DEV_SERVER_URL);
    // Open devTools automatically in development
    win.webContents.openDevTools();
  } else {
    // win.loadFile('dist/index.html')
    win.loadFile(path.join(process.env.DIST as string, 'index.html'));
  }
}

// Save files the user opened this session. Only these may be written back, so the renderer can't
// ask the main process to overwrite arbitrary paths.
const writableSaveFiles = new Set<string>();

// Set while the user reloads a hung window, so that kill isn't reported as a crash.
let killingHungRenderer = false;

async function reportRendererGone(details: Electron.RenderProcessGoneDetails) {
  if (killingHungRenderer) {
    killingHungRenderer = false;
    return;
  }
  if (!win || details.reason === 'clean-exit') return;
  const report = [
    'Daggerfall Unity Save Editor – error report',
    `Version: ${app.getVersion()}`,
    `Time: ${new Date().toISOString()}`,
    'Where: Window process',
    `System: ${process.platform} ${process.arch}, Electron ${process.versions.electron}, Chrome ${process.versions.chrome}`,
    '',
    `Error: the window's process stopped (${details.reason}, exit code ${details.exitCode})`,
  ].join('\n');

  // Loops so "Copy" can be pressed and the dialog stays until the user picks Reload or Quit.
  for (;;) {
    const { response } = await dialog.showMessageBox(win, {
      type: 'error',
      title: 'The editor stopped working',
      message: 'The editor window crashed, and any unsaved changes were lost.',
      detail: `${report}\n\nCopy this report and send it with your bug report. It doesn't contain your save data.`,
      buttons: ['Copy error report', 'Reload', 'Quit'],
      defaultId: 0,
      cancelId: 1,
      noLink: true,
    });
    if (response === 0) {
      clipboard.writeText(report);
      continue;
    }
    if (response === 1) win.webContents.reload();
    else app.quit();
    return;
  }
}

// Loads SaveData.txt plus its optional sibling files. QuestData, NotebookData and SaveInfo are read-only.
async function loadSaveFolder(filePath: string): Promise<LoadResult> {
  try {
    const data = JSON.parse(await fs.readFile(filePath, 'utf-8'));
    writableSaveFiles.add(path.resolve(filePath));

    const dirPath = path.dirname(filePath);
    const readSibling = async (fileName: string) => {
      try {
        const raw = await fs.readFile(path.join(dirPath, fileName), 'utf-8');
        return JSON.parse(raw);
      } catch {
        return null;
      }
    };
    const [factionData, questData, notebookData, saveInfo] = await Promise.all([
      readSibling('FactionData.txt'),
      readSibling('QuestData.txt'),
      readSibling('NotebookData.txt'),
      readSibling('SaveInfo.txt'),
    ]);

    return { success: true, filePath, data, factionData, questData, notebookData, saveInfo };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

// IPC Handlers
ipcMain.handle('dialog:openSaveData', async (): Promise<LoadResult> => {
  const { canceled, filePaths } = await dialog.showOpenDialog(win!, {
    properties: ['openFile'],
    filters: [{ name: 'Saves', extensions: ['txt', 'json'] }]
  });
  if (!canceled && filePaths.length > 0) {
    return loadSaveFolder(filePaths[0]);
  }
  return { success: false, canceled: true };
});

// Save browser. Locations the user adds are kept in the editor's own settings, not DFU's.
const settingsFile = () => path.join(app.getPath('userData'), 'settings.json');

async function scanLocations() {
  return resolveLocations(await readSettingsFile(settingsFile()), currentEnv());
}

// Only SAVE<n> folders inside a currently resolved saves root may be read.
async function assertSaveFolder(folder: string) {
  const roots = (await scanLocations()).flatMap((location) => (location.root ? [location.root] : []));
  if (!isSaveFolderInRoots(folder, roots)) {
    throw new Error('That folder is not inside a known save location.');
  }
}

async function pickFolder(title: string, allowAppBundles = false) {
  const properties: Electron.OpenDialogOptions['properties'] = ['openDirectory'];
  // On macOS an app bundle is a package, so it's only selectable as a file.
  if (allowAppBundles && process.platform === 'darwin') properties.push('openFile');
  const { canceled, filePaths } = await dialog.showOpenDialog(win!, { title, properties });
  return canceled || filePaths.length === 0 ? null : filePaths[0];
}

async function addPortableInstall(baseDir: string, message?: string): Promise<AddLocationResult> {
  const settings = await readSettingsFile(settingsFile());
  if (!settings.portableInstalls.includes(baseDir)) {
    settings.portableInstalls.push(baseDir);
    await writeSettingsFile(settingsFile(), settings);
  }
  const location = (await resolveLocations(settings, currentEnv())).find((l) => l.id === `portable:${baseDir}`);
  return { location, message: message ?? (location?.root ? undefined : location?.warning) };
}

ipcMain.handle('saves:scan', async () => {
  const locations = await scanLocations();
  const saves = (await Promise.all(locations.map(listSaves))).flat();
  return { locations, saves };
});

ipcMain.handle('saves:addInstall', async (): Promise<AddLocationResult> => {
  const picked = await pickFolder('Choose your Daggerfall Unity install folder', true);
  if (!picked) return { canceled: true };

  const install = await findInstallBaseDir(picked);
  if (!install) {
    return { error: `${picked} doesn't look like a Daggerfall Unity install (no Portable.txt and no *_Data folder).` };
  }
  if (install.portable) {
    return addPortableInstall(install.baseDir);
  }

  const settings = await readSettingsFile(settingsFile());
  settings.regularInstallDir = install.baseDir;
  await writeSettingsFile(settingsFile(), settings);
  return {
    message: "This install isn't portable, so it keeps its saves in the default location. The editor will use this folder to resolve a relative save path in DFU's settings.ini.",
  };
});

ipcMain.handle('saves:addFolder', async (): Promise<AddLocationResult> => {
  const picked = await pickFolder('Choose a folder with Daggerfall Unity saves');
  if (!picked) return { canceled: true };

  const portableInstall = await findEnclosingPortableInstall(picked);
  if (portableInstall) {
    return addPortableInstall(portableInstall, `This folder belongs to the portable install at ${portableInstall}, so it was added as that install.`);
  }

  const settings = await readSettingsFile(settingsFile());
  if (!settings.folders.includes(picked)) {
    settings.folders.push(picked);
    await writeSettingsFile(settingsFile(), settings);
  }
  const location = (await resolveLocations(settings, currentEnv())).find((l) => l.id === `folder:${picked}`);
  return { location };
});

ipcMain.handle('saves:removeLocation', async (_event, id: string) => {
  const settings = await readSettingsFile(settingsFile());
  settings.portableInstalls = settings.portableInstalls.filter((dir) => `portable:${dir}` !== id);
  settings.folders = settings.folders.filter((dir) => `folder:${dir}` !== id);
  await writeSettingsFile(settingsFile(), settings);
});

ipcMain.handle('saves:screenshot', async (_event, folder: string) => {
  await assertSaveFolder(folder);
  try {
    const image = await fs.readFile(screenshotPath(folder));
    return `data:image/jpeg;base64,${image.toString('base64')}`;
  } catch {
    return null;
  }
});

ipcMain.handle('saves:load', async (_event, folder: string): Promise<LoadResult> => {
  try {
    await assertSaveFolder(folder);
  } catch (error: any) {
    return { success: false, error: error.message };
  }
  return loadSaveFolder(path.join(folder, 'SaveData.txt'));
});

// Copies an existing file to bak_<name>.<n><ext>. A missing file needs no backup; any other
// failure throws so the original is never overwritten without one.
async function backupFile(filePath: string) {
  try {
    await fs.access(filePath);
  } catch {
    return;
  }

  const parsedPath = path.parse(filePath);
  const files = await fs.readdir(parsedPath.dir);

  const escapedName = parsedPath.name.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const escapedExt = parsedPath.ext.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const backupRegex = new RegExp(`^bak_${escapedName}\\.(\\d+)${escapedExt}$`);

  let maxIndex = -1;
  for (const file of files) {
    const match = file.match(backupRegex);
    if (match) {
      maxIndex = Math.max(maxIndex, parseInt(match[1], 10));
    }
  }

  const backupPath = path.join(parsedPath.dir, `bak_${parsedPath.name}.${maxIndex + 1}${parsedPath.ext}`);
  await fs.copyFile(filePath, backupPath);
}

// Writes to a temp file and renames it into place, so a crash can't leave a truncated save.
async function writeJsonAtomic(filePath: string, data: unknown) {
  const tempPath = `${filePath}.tmp`;
  try {
    await fs.writeFile(tempPath, JSON.stringify(data, null, 2), 'utf-8');
    await fs.rename(tempPath, filePath);
  } catch (error) {
    await fs.rm(tempPath, { force: true });
    throw error;
  }
}

// Only the files passed are written (and backed up); null/undefined means unchanged.
ipcMain.handle('fs:saveData', async (_event, filePath: string, data: any | null, factionData?: any) => {
  try {
    if (typeof filePath !== 'string' || !writableSaveFiles.has(path.resolve(filePath))) {
      throw new Error('That file was not opened in this session, so it will not be written.');
    }

    if (data) {
      await backupFile(filePath);
      await writeJsonAtomic(filePath, data);
    }

    if (factionData) {
      const factionFilePath = path.join(path.dirname(filePath), 'FactionData.txt');
      await backupFile(factionFilePath);
      await writeJsonAtomic(factionFilePath, factionData);
    }

    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
});

ipcMain.handle('app:copyText', (_event, text: unknown) => {
  if (typeof text !== 'string') throw new Error('Only text can be copied.');
  clipboard.writeText(text.slice(0, 100_000));
});

// App events
app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
    win = null;
  }
});

app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow();
  }
});

app.whenReady().then(createWindow);
