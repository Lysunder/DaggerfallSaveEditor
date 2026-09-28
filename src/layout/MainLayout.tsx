import { useState } from 'react';
import { Box, AppBar, CssBaseline, Toolbar, Typography, Button, Dialog, DialogContent, DialogActions, Tooltip } from '@mui/material';
import { Outlet } from 'react-router-dom';

import FolderOpenIcon from '@mui/icons-material/FolderOpen';
import SaveIcon from '@mui/icons-material/Save';
import ListIcon from '@mui/icons-material/List';

import { useSaveStore } from '../store/useSaveStore';
import { useNotification } from '../context/NotificationContext';
import { useSaveLoader } from '../hooks/useSaveLoader';
import { SaveBrowser } from '../components/SaveBrowser';

export default function MainLayout() {
  const currentFilePath = useSaveStore((state) => state.currentFilePath);
  const saveData = useSaveStore((state) => state.saveData);
  const saveInfo = useSaveStore((state) => state.saveInfo);
  const { showNotification } = useNotification();
  const { openFile } = useSaveLoader();
  const [browserOpen, setBrowserOpen] = useState(false);

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

  const currentSaveLabel = !currentFilePath
    ? 'No save loaded'
    : saveInfo
      ? `Editing: ${saveInfo.characterName} – ${saveInfo.saveName}`
      : `Editing: ${currentFilePath}`;

  return (
    <Box sx={{ display: 'flex' }}>
      <CssBaseline />
      <AppBar position="fixed" sx={{ zIndex: (theme) => theme.zIndex.drawer + 1 }}>
        <Toolbar>
          <Typography variant="h6" noWrap component="div" sx={{ flexGrow: 1 }}>
            Daggerfall Unity Save Editor
            <Typography component="span" variant="body2" color="text.secondary" sx={{ ml: 1 }}>
              v{__APP_VERSION__}
            </Typography>
          </Typography>
          <Tooltip title={currentFilePath ?? ''}>
            <Typography variant="body2" noWrap sx={{ mr: 2, maxWidth: 360 }}>
              {currentSaveLabel}
            </Typography>
          </Tooltip>
          {/* Without a save loaded, the browser is already on the page. */}
          {saveData && (
            <Button color="inherit" startIcon={<ListIcon />} onClick={() => setBrowserOpen(true)}>
              Saves
            </Button>
          )}
          <Button color="inherit" startIcon={<FolderOpenIcon />} onClick={openFile}>
            Open file…
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

      <Dialog open={browserOpen} onClose={() => setBrowserOpen(false)} fullWidth maxWidth="md">
        <DialogContent>
          <SaveBrowser onLoaded={() => setBrowserOpen(false)} />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setBrowserOpen(false)}>Close</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
