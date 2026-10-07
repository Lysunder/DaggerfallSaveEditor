import { useEffect, useState } from 'react';
import { Box, AppBar, Badge, Chip, CssBaseline, Toolbar, Typography, Button, Dialog, DialogContent, DialogActions, Tooltip } from '@mui/material';
import { Outlet } from 'react-router-dom';

import FolderOpenIcon from '@mui/icons-material/FolderOpen';
import SaveIcon from '@mui/icons-material/Save';
import ListIcon from '@mui/icons-material/List';

import { useSaveStore } from '../store/useSaveStore';
import { useSaveLoader } from '../hooks/useSaveLoader';
import { useSaveWriter } from '../hooks/useSaveWriter';
import { useUnsavedChanges } from '../hooks/useUnsavedChanges';
import { SaveBrowser } from '../components/SaveBrowser';
import { ChangeListDialog } from '../components/ChangeListDialog';
import { ErrorBoundary } from '../components/errors/ErrorBoundary';

const APP_TITLE = 'Daggerfall Unity Save Editor';

export default function MainLayout() {
  const currentFilePath = useSaveStore((state) => state.currentFilePath);
  const saveData = useSaveStore((state) => state.saveData);
  const saveInfo = useSaveStore((state) => state.saveInfo);
  const { openFile } = useSaveLoader();
  const { save } = useSaveWriter();
  const { count, isDirty } = useUnsavedChanges();
  const [browserOpen, setBrowserOpen] = useState(false);
  const [changesOpen, setChangesOpen] = useState(false);

  useEffect(() => {
    document.title = isDirty ? `* ${APP_TITLE}` : APP_TITLE;
  }, [isDirty]);

  // Blocks closing or reloading while there are unsaved changes; the main process then asks the user.
  useEffect(() => {
    if (!isDirty) return;
    const block = (event: BeforeUnloadEvent) => {
      event.preventDefault();
      event.returnValue = false;
    };
    window.addEventListener('beforeunload', block);
    return () => window.removeEventListener('beforeunload', block);
  }, [isDirty]);

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
            {APP_TITLE}
            <Typography component="span" variant="body2" color="text.secondary" sx={{ ml: 1 }}>
              v{__APP_VERSION__}
            </Typography>
          </Typography>
          <Tooltip title={currentFilePath ?? ''}>
            <Typography variant="body2" noWrap sx={{ mr: 1, maxWidth: 360 }}>
              {currentSaveLabel}
            </Typography>
          </Tooltip>
          {isDirty && (
            <Chip
              label={`● ${count} unsaved ${count === 1 ? 'change' : 'changes'}`}
              size="small"
              color="warning"
              onClick={() => setChangesOpen(true)}
              sx={{ mr: 2 }}
            />
          )}
          {/* Without a save loaded, the browser is already on the page. */}
          {saveData && (
            <Button color="inherit" startIcon={<ListIcon />} onClick={() => setBrowserOpen(true)}>
              Saves
            </Button>
          )}
          <Button color="inherit" startIcon={<FolderOpenIcon />} onClick={openFile}>
            Open file…
          </Button>
          <Button
            color="inherit"
            onClick={save}
            disabled={!currentFilePath || !isDirty}
            startIcon={
              <Badge badgeContent={isDirty ? count : undefined} color="warning" invisible={!isDirty} max={99}>
                <SaveIcon />
              </Badge>
            }
          >
            Save
          </Button>
        </Toolbar>
      </AppBar>
      <Box component="main" sx={{ flexGrow: 1, p: 3 }}>
        <Toolbar />
        {/* Keeps the toolbar, and with it Save, working if the page fails. */}
        <ErrorBoundary name="Page" resetKey={currentFilePath}>
          <Outlet />
        </ErrorBoundary>
      </Box>

      <Dialog open={browserOpen} onClose={() => setBrowserOpen(false)} fullWidth maxWidth="md">
        <DialogContent>
          <ErrorBoundary name="Save browser">
            <SaveBrowser onLoaded={() => setBrowserOpen(false)} />
          </ErrorBoundary>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setBrowserOpen(false)}>Close</Button>
        </DialogActions>
      </Dialog>

      <ErrorBoundary name="Change list" resetKey={changesOpen}>
        <ChangeListDialog open={changesOpen} onClose={() => setChangesOpen(false)} />
      </ErrorBoundary>
    </Box>
  );
}
