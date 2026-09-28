import { useSaveStore, type DFCareer } from '../store/useSaveStore';
import { findEnumRepairs } from '../data/dfuEnums';
import { useNotification } from '../context/NotificationContext';
import { useConfirm } from '../context/confirm';
import { changeId } from '../utils/saveDiff';
import { useUnsavedChanges } from './useUnsavedChanges';
import { useSaveWriter } from './useSaveWriter';
import type { LoadResult } from '../../electron/saveTypes';

/** Opening a save from the file dialog or the save browser, with the same store update and notifications. */
export const useSaveLoader = () => {
  const loadSaveData = useSaveStore((state) => state.loadSaveData);
  const updateCareerField = useSaveStore((state) => state.updateCareerField);
  const setRepairs = useSaveStore((state) => state.setRepairs);
  const { showNotification } = useNotification();
  const { isDirty, count } = useUnsavedChanges();
  const { save } = useSaveWriter();
  const confirm = useConfirm();

  /** Before replacing the loaded save, offers to save or discard unsaved changes. */
  const confirmLeave = async (): Promise<boolean> => {
    if (!isDirty) return true;
    const info = useSaveStore.getState().saveInfo;
    const current = info ? `${info.characterName} – ${info.saveName}` : 'this save';
    const choice = await confirm({
      title: 'Unsaved changes',
      message: `You have ${count} unsaved ${count === 1 ? 'change' : 'changes'} to ${current}. Discard ${count === 1 ? 'it' : 'them'} and open another save?`,
      actions: [
        { value: 'cancel', label: 'Cancel', color: 'inherit' },
        { value: 'discard', label: 'Discard', color: 'error' },
        { value: 'save', label: 'Save first', variant: 'contained' },
      ],
      cancelValue: 'cancel',
    });
    if (choice === 'save') return save();
    return choice === 'discard';
  };

  const apply = (result: LoadResult): boolean => {
    if (result.success) {
      loadSaveData(result);
      const info = result.saveInfo;
      const loaded = info ? `Loaded ${info.characterName} – ${info.saveName}` : `Loaded ${result.filePath}`;

      // Saves edited by older versions of this app can contain values DFU refuses to load.
      // Fix them as ordinary edits, so they're written on the next save.
      const repairs = findEnumRepairs(result.data);
      for (const repair of repairs) {
        updateCareerField(repair.path.split('.').pop() as keyof DFCareer, repair.after);
      }
      setRepairs(repairs.map((repair) => {
        const path = repair.path.split('.');
        return { id: changeId('save', path), path, value: repair.after };
      }));
      if (repairs.length > 0) {
        showNotification(
          `${loaded}. Fixed ${repairs.length} career ${repairs.length === 1 ? 'value' : 'values'} that Daggerfall Unity can't read; save to write the fix.`,
          'warning',
        );
      } else {
        showNotification(loaded, 'success');
      }
      return true;
    }
    if (!result.canceled) {
      showNotification(`Failed to open save data: ${result.error}`, 'error');
    }
    return false;
  };

  const run = async (load: () => Promise<LoadResult>) => {
    try {
      if (!(await confirmLeave())) return false;
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
