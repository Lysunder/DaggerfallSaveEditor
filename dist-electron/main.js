//#region \0rolldown/runtime.js
var __create = Object.create;
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __getProtoOf = Object.getPrototypeOf;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __copyProps = (to, from, except, desc) => {
	if (from && typeof from === "object" || typeof from === "function") for (var keys = __getOwnPropNames(from), i = 0, n = keys.length, key; i < n; i++) {
		key = keys[i];
		if (!__hasOwnProp.call(to, key) && key !== except) __defProp(to, key, {
			get: ((k) => from[k]).bind(null, key),
			enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable
		});
	}
	return to;
};
var __toESM = (mod, isNodeMode, target) => (target = mod != null ? __create(__getProtoOf(mod)) : {}, __copyProps(isNodeMode || !mod || !mod.__esModule || !__hasOwnProp.call(mod, "default") ? __defProp(target, "default", {
	value: mod,
	enumerable: true
}) : target, mod));
//#endregion
let electron = require("electron");
let node_path = require("node:path");
node_path = __toESM(node_path);
let node_fs_promises = require("node:fs/promises");
node_fs_promises = __toESM(node_fs_promises);
let node_url = require("node:url");
//#region electron/main.ts
var __dirname$1 = node_path.default.dirname((0, node_url.fileURLToPath)(require("url").pathToFileURL(__filename).href));
process.env.DIST = node_path.default.join(__dirname$1, "../dist");
process.env.VITE_PUBLIC = electron.app.isPackaged ? process.env.DIST : node_path.default.join(process.env.DIST, "../public");
var win;
var VITE_DEV_SERVER_URL = process.env["VITE_DEV_SERVER_URL"];
function createWindow() {
	win = new electron.BrowserWindow({
		icon: node_path.default.join(process.env.VITE_PUBLIC, "electron-vite.svg"),
		width: 1200,
		height: 800,
		webPreferences: { preload: node_path.default.join(__dirname$1, "preload.js") }
	});
	win.webContents.on("did-finish-load", () => {
		win?.webContents.send("main-process-message", (/* @__PURE__ */ new Date()).toLocaleString());
	});
	win.webContents.on("console-message", (event, level, message, line, sourceId) => {
		console.log(`[Renderer]: ${message} (at ${sourceId}:${line})`);
	});
	if (VITE_DEV_SERVER_URL) {
		win.loadURL(VITE_DEV_SERVER_URL);
		win.webContents.openDevTools();
	} else win.loadFile(node_path.default.join(process.env.DIST, "index.html"));
}
electron.ipcMain.handle("dialog:openSaveData", async () => {
	const { canceled, filePaths } = await electron.dialog.showOpenDialog(win, {
		properties: ["openFile"],
		filters: [{
			name: "Saves",
			extensions: ["txt", "json"]
		}]
	});
	if (!canceled && filePaths.length > 0) try {
		const filePath = filePaths[0];
		const rawData = await node_fs_promises.default.readFile(filePath, "utf-8");
		return {
			success: true,
			filePath,
			data: JSON.parse(rawData)
		};
	} catch (error) {
		return {
			success: false,
			error: error.message
		};
	}
	return {
		success: false,
		canceled: true
	};
});
electron.ipcMain.handle("fs:saveData", async (_event, filePath, data) => {
	try {
		const rawData = JSON.stringify(data, null, 2);
		await node_fs_promises.default.writeFile(filePath, rawData, "utf-8");
		return { success: true };
	} catch (error) {
		return {
			success: false,
			error: error.message
		};
	}
});
electron.app.on("window-all-closed", () => {
	if (process.platform !== "darwin") {
		electron.app.quit();
		win = null;
	}
});
electron.app.on("activate", () => {
	if (electron.BrowserWindow.getAllWindows().length === 0) createWindow();
});
electron.app.whenReady().then(createWindow);
//#endregion
