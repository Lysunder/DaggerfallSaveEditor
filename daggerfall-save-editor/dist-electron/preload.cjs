import { contextBridge as e, ipcRenderer as t } from "electron";
//#endregion
//#region electron/preload.cts
var n = /* @__PURE__ */ ((e, t) => () => (t || (e((t = { exports: {} }).exports, t), e = null), t.exports))((() => {
	e.exposeInMainWorld("ipcRenderer", {
		on(...e) {
			let [n, r] = e;
			return t.on(n, (e, ...t) => r(e, ...t));
		},
		off(...e) {
			let [n, ...r] = e;
			return t.off(n, ...r);
		},
		send(...e) {
			let [n, ...r] = e;
			return t.send(n, ...r);
		},
		invoke(...e) {
			let [n, ...r] = e;
			return t.invoke(n, ...r);
		},
		openSaveData: () => t.invoke("dialog:openSaveData"),
		saveData: (e, n) => t.invoke("fs:saveData", e, n)
	});
}));
//#endregion
export default n();
export {};
