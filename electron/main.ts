import { app, BrowserWindow, ipcMain, dialog, shell } from 'electron';
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
    icon: path.join(process.env.VITE_PUBLIC as string, 'electron-vite.svg'),
    width: 1200,
    height: 800,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
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

  // Test active push message to Renderer-process.
  win.webContents.on('did-finish-load', () => {
    win?.webContents.send('main-process-message', (new Date).toLocaleString());
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

  win.webContents.on('console-message', ({ message, sourceId, lineNumber }) => {
    console.log(`[Renderer]: ${message} (at ${sourceId}:${lineNumber})`);
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

// Loads SaveData.txt plus its optional sibling files. QuestData, NotebookData and SaveInfo are read-only.
async function loadSaveFolder(filePath: string): Promise<LoadResult> {
  try {
    const data = JSON.parse(await fs.readFile(filePath, 'utf-8'));

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

async function backupFile(filePath: string) {
  try {
    await fs.access(filePath);
    const parsedPath = path.parse(filePath);
    
    const files = await fs.readdir(parsedPath.dir);
    
    const escapedName = parsedPath.name.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const escapedExt = parsedPath.ext.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const backupRegex = new RegExp(`^bak_${escapedName}\\.(\\d+)${escapedExt}$`);
    
    let maxIndex = -1;
    for (const file of files) {
      const match = file.match(backupRegex);
      if (match) {
        const index = parseInt(match[1], 10);
        if (index > maxIndex) {
          maxIndex = index;
        }
      }
    }
    
    const nextIndex = maxIndex + 1;
    const backupPath = path.join(parsedPath.dir, `bak_${parsedPath.name}.${nextIndex}${parsedPath.ext}`);
    await fs.copyFile(filePath, backupPath);
  } catch {
    // File doesn't exist, no need to backup
  }
}

// Only the files passed are written (and backed up); null/undefined means unchanged.
ipcMain.handle('fs:saveData', async (_event, filePath: string, data: any | null, factionData?: any) => {
  try {
    if (data) {
      await backupFile(filePath);
      const rawData = JSON.stringify(data, null, 2);
      await fs.writeFile(filePath, rawData, 'utf-8');
    }

    if (factionData) {
      const dirPath = path.dirname(filePath);
      const factionFilePath = path.join(dirPath, 'FactionData.txt');
      
      await backupFile(factionFilePath);
      
      const rawFactionData = JSON.stringify(factionData, null, 2);
      await fs.writeFile(factionFilePath, rawFactionData, 'utf-8');
    }

    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
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
