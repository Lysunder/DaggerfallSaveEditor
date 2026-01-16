import { ipcRenderer, contextBridge } from 'electron'

// --------- Expose some API to the Renderer process ---------
contextBridge.exposeInMainWorld('ipcRenderer', {
  on(...args: Parameters<typeof ipcRenderer.on>) {
    const [channel, listener] = args
    return ipcRenderer.on(channel, (event, ...args) => listener(event, ...args))
  },
  off(...args: Parameters<typeof ipcRenderer.off>) {
    const [channel, ...omit] = args
    return ipcRenderer.off(channel, ...omit)
  },
  send(...args: Parameters<typeof ipcRenderer.send>) {
    const [channel, ...omit] = args
    return ipcRenderer.send(channel, ...omit)
  },
  invoke(...args: Parameters<typeof ipcRenderer.invoke>) {
    const [channel, ...omit] = args
    return ipcRenderer.invoke(channel, ...omit)
  },

  // File I/O
  onOpen: (callback: (data: { path: string, content: string }) => void) => {
    ipcRenderer.on('file:opened', (_event, data) => callback(data))
  },
  onSaveRequest: (callback: () => void) => {
    ipcRenderer.on('file:request-save', () => callback())
  },
  onSaved: (callback: (data: { path: string }) => void) => {
      ipcRenderer.on('file:saved', (_event, data) => callback(data))
  },
  saveContent: (path: string | null, content: string) => {
    ipcRenderer.send('file:save-content', { path, content })
  }
})
