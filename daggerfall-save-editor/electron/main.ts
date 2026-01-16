import { app, BrowserWindow, Menu, dialog, ipcMain } from 'electron'
import path from 'node:path'
import fs from 'node:fs'

// The built directory structure
//
// ├─┬─┬ dist
// │ │ └── index.html
// │ │
// │ ├─┬ dist-electron
// │ │ ├── main.js
// │ │ └── preload.js
// │
process.env.DIST = path.join(__dirname, '../dist')
process.env.VITE_PUBLIC = app.isPackaged ? process.env.DIST : path.join(__dirname, '../public')

let win: BrowserWindow | null

// 🚧 Use ['ENV_NAME'] avoid vite:define plugin - Vite@2.x
const VITE_DEV_SERVER_URL = process.env['VITE_DEV_SERVER_URL']

function createWindow() {
  win = new BrowserWindow({
    icon: path.join(process.env.VITE_PUBLIC as string, 'electron-vite.svg'),
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
    },
  })

  // Test active push message to Renderer-process.
  win.webContents.on('did-finish-load', () => {
    win?.webContents.send('main-process-message', (new Date).toLocaleString())
  })

  if (VITE_DEV_SERVER_URL) {
    win.loadURL(VITE_DEV_SERVER_URL)
  } else {
    // win.loadFile('dist/index.html')
    win.loadFile(path.join(process.env.DIST as string, 'index.html'))
  }
}

// Menu Definition
const createMenu = () => {
  const template: Electron.MenuItemConstructorOptions[] = [
    {
      label: 'File',
      submenu: [
        {
          label: 'Open',
          click: async () => {
            if (!win) return
            const { canceled, filePaths } = await dialog.showOpenDialog(win, {
              properties: ['openFile'],
              filters: [{ name: 'JSON', extensions: ['json', 'txt'] }],
            })
            if (!canceled && filePaths.length > 0) {
              const content = await fs.promises.readFile(filePaths[0], 'utf-8')
              win.webContents.send('file:opened', { path: filePaths[0], content })
            }
          }
        },
        {
          label: 'Save',
          click: () => {
             win?.webContents.send('file:request-save')
          }
        },
        { type: 'separator' },
        {
          label: 'Exit',
          click: () => {
            app.quit()
          }
        }
      ]
    }
  ]

  const menu = Menu.buildFromTemplate(template)
  Menu.setApplicationMenu(menu)
}

ipcMain.on('file:save-content', async (_event, { path: filePath, content }) => {
  if (!win) return
  
  let targetPath = filePath
  if (!targetPath) {
    const { canceled, filePath: savePath } = await dialog.showSaveDialog(win, {
      filters: [{ name: 'JSON', extensions: ['json', 'txt'] }],
    })
    if (canceled || !savePath) return
    targetPath = savePath
  }

  await fs.promises.writeFile(targetPath, content, 'utf-8')
  win.webContents.send('file:saved', { path: targetPath })
})


app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit()
  }
})

app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow()
  }
})

app.whenReady().then(() => {
    createMenu()
    createWindow()
})
