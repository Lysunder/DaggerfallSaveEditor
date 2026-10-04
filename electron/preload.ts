import { ipcRenderer, contextBridge } from 'electron';

// --------- Expose some API to the Renderer process ---------
contextBridge.exposeInMainWorld('ipcRenderer', {
  // Specific API for our app
  openSaveData: () => ipcRenderer.invoke('dialog:openSaveData'),
  saveData: (filePath: string, data: any | null, factionData?: any) => ipcRenderer.invoke('fs:saveData', filePath, data, factionData),

  // Save browser
  scanSaves: () => ipcRenderer.invoke('saves:scan'),
  addSaveInstall: () => ipcRenderer.invoke('saves:addInstall'),
  addSaveFolder: () => ipcRenderer.invoke('saves:addFolder'),
  removeSaveLocation: (id: string) => ipcRenderer.invoke('saves:removeLocation', id),
  getSaveScreenshot: (folder: string) => ipcRenderer.invoke('saves:screenshot', folder),
  loadSaveSlot: (folder: string) => ipcRenderer.invoke('saves:load', folder),
});
