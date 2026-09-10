import { Box, AppBar, CssBaseline, Toolbar, Typography, Button } from '@mui/material';
import { Outlet } from 'react-router-dom';

import FolderOpenIcon from '@mui/icons-material/FolderOpen';
import SaveIcon from '@mui/icons-material/Save';

import { useSaveStore } from '../store/useSaveStore';
import { useNotification } from '../context/NotificationContext';

export default function MainLayout() {
  const currentFilePath = useSaveStore((state) => state.currentFilePath);
  const saveData = useSaveStore((state) => state.saveData);
  const loadSaveData = useSaveStore((state) => state.loadSaveData);
  const { showNotification } = useNotification();

  const handleOpenFile = async () => {
    try {
      const result = await window.ipcRenderer.openSaveData();
      if (result.success && result.filePath && result.data) {
        loadSaveData(result.filePath, result.data, result.factionData);
        showNotification(`Successfully loaded ${result.filePath}`, 'success');
      } else if (!result.success && !result.canceled) {
        showNotification(`Failed to open save data: ${result.error}`, 'error');
      }
    } catch (error: any) {
      showNotification(`An unexpected error occurred: ${error.message}`, 'error');
    }
  };

  const handleSaveFile = async () => {
    if (!currentFilePath || !saveData) return;
    
    try {
      const factionData = useSaveStore.getState().factionData;
      const result = await window.ipcRenderer.saveData(currentFilePath, saveData, factionData);
      if (result.success) {
        showNotification('Save data written successfully!', 'success');
      } else {
        showNotification(`Failed to write save data: ${result.error}`, 'error');
      }
    } catch (error: any) {
      showNotification(`An unexpected error occurred: ${error.message}`, 'error');
    }
  };

  return (
    <Box sx={{ display: 'flex' }}>
      <CssBaseline />
      <AppBar position="fixed" sx={{ zIndex: (theme) => theme.zIndex.drawer + 1 }}>
        <Toolbar>
          <Typography variant="h6" noWrap component="div" sx={{ flexGrow: 1 }}>
            Daggerfall Unity Save Editor
          </Typography>
          <Typography variant="body2" sx={{ mr: 2 }}>
            {currentFilePath ? `Editing: ${currentFilePath}` : 'No save loaded'}
          </Typography>
          <Button color="inherit" startIcon={<FolderOpenIcon />} onClick={handleOpenFile}>
            Open
          </Button>
          <Button color="inherit" startIcon={<SaveIcon />} onClick={handleSaveFile} disabled={!currentFilePath}>
            Save
          </Button>
        </Toolbar>
      </AppBar>
      <Box component="main" sx={{ flexGrow: 1, p: 3 }}>
        <Toolbar />
        <Outlet />
      </Box>
    </Box>
  );
}
