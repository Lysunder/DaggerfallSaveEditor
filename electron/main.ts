import { app, BrowserWindow, ipcMain, dialog } from 'electron';
import path from 'node:path';
import fs from 'node:fs/promises';
import { fileURLToPath } from 'node:url';

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

  // Test active push message to Renderer-process.
  win.webContents.on('did-finish-load', () => {
    win?.webContents.send('main-process-message', (new Date).toLocaleString());
  });

  win.webContents.on('console-message', (event, level, message, line, sourceId) => {
    console.log(`[Renderer]: ${message} (at ${sourceId}:${line})`);
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

// IPC Handlers
ipcMain.handle('dialog:openSaveData', async () => {
  const { canceled, filePaths } = await dialog.showOpenDialog(win!, {
    properties: ['openFile'],
    filters: [{ name: 'Saves', extensions: ['txt', 'json'] }]
  });
  if (!canceled && filePaths.length > 0) {
    try {
      const filePath = filePaths[0];
      const rawData = await fs.readFile(filePath, 'utf-8');
      const parsedData = JSON.parse(rawData);

      // Check for FactionData.txt
      let factionData = null;
      const dirPath = path.dirname(filePath);
      const factionFilePath = path.join(dirPath, 'FactionData.txt');
      try {
        const factionRaw = await fs.readFile(factionFilePath, 'utf-8');
        factionData = JSON.parse(factionRaw);
      } catch (err) {
        // Ignore if FactionData.txt does not exist
      }

      return { success: true, filePath, data: parsedData, factionData };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  }
  return { success: false, canceled: true };
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

ipcMain.handle('fs:saveData', async (_event, filePath: string, data: any, factionData?: any) => {
  try {
    await backupFile(filePath);
    
    const rawData = JSON.stringify(data, null, 2);
    await fs.writeFile(filePath, rawData, 'utf-8');

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
