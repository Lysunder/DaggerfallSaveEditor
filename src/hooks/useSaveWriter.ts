import { useSaveStore } from '../store/useSaveStore';
import { useNotification } from '../context/NotificationContext';
import { diffAll } from '../utils/saveDiff';

/** Writes unsaved changes to disk. Only files that changed are written (and backed up). */
export const useSaveWriter = () => {
  const markSaved = useSaveStore((state) => state.markSaved);
  const { showNotification } = useNotification();

  const save = async (): Promise<boolean> => {
    const { currentFilePath, saveData, factionData, baselineSaveData, baselineFactionData } = useSaveStore.getState();
    if (!currentFilePath || !saveData) return false;

    const changes = diffAll(baselineSaveData, saveData, baselineFactionData, factionData);
    const saveChanged = changes.some((change) => change.file === 'save');
    const factionChanged = changes.some((change) => change.file === 'faction');

    try {
      const result = await window.ipcRenderer.saveData(
        currentFilePath,
        saveChanged ? saveData : null,
        factionChanged ? factionData : undefined,
      );
      if (!result.success) {
        showNotification(`Failed to write save data: ${result.error}`, 'error');
        return false;
      }
      markSaved();
      showNotification(`Saved ${changes.length} ${changes.length === 1 ? 'change' : 'changes'}.`, 'success');
      return true;
    } catch (error: any) {
      showNotification(`An unexpected error occurred: ${error.message}`, 'error');
      return false;
    }
  };

  return { save };
};
