import { useSaveStore } from '../store/useSaveStore';
import { useNotification } from '../context/NotificationContext';
import type { LoadResult } from '../../electron/saveTypes';

/** Opening a save from the file dialog or the save browser, with the same store update and notifications. */
export const useSaveLoader = () => {
  const loadSaveData = useSaveStore((state) => state.loadSaveData);
  const { showNotification } = useNotification();

  const apply = (result: LoadResult): boolean => {
    if (result.success) {
      loadSaveData(result);
      const info = result.saveInfo;
      showNotification(info ? `Loaded ${info.characterName} – ${info.saveName}` : `Loaded ${result.filePath}`, 'success');
      return true;
    }
    if (!result.canceled) {
      showNotification(`Failed to open save data: ${result.error}`, 'error');
    }
    return false;
  };

  const run = async (load: () => Promise<LoadResult>) => {
    try {
      return apply(await load());
    } catch (error: any) {
      showNotification(`An unexpected error occurred: ${error.message}`, 'error');
      return false;
    }
  };

  return {
    openFile: () => run(() => window.ipcRenderer.openSaveData()),
    loadSlot: (folder: string) => run(() => window.ipcRenderer.loadSaveSlot(folder)),
  };
};
