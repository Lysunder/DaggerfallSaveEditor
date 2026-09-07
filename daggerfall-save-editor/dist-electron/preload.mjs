import { createRequire } from "node:module";
//#endregion
//#region electron/preload.ts
var { ipcRenderer, contextBridge } = (/* @__PURE__ */ (() => createRequire(import.meta.url))())("electron");
contextBridge.exposeInMainWorld("ipcRenderer", {
	on(...args) {
		const [channel, listener] = args;
		return ipcRenderer.on(channel, (event, ...args) => listener(event, ...args));
	},
	off(...args) {
		const [channel, ...omit] = args;
		return ipcRenderer.off(channel, ...omit);
	},
	send(...args) {
		const [channel, ...omit] = args;
		return ipcRenderer.send(channel, ...omit);
	},
	invoke(...args) {
		const [channel, ...omit] = args;
		return ipcRenderer.invoke(channel, ...omit);
	},
	openSaveData: () => ipcRenderer.invoke("dialog:openSaveData"),
	saveData: (filePath, data) => ipcRenderer.invoke("fs:saveData", filePath, data)
});
//#endregion
export {};
