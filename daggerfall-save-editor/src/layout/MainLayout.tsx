import { Box, Drawer, AppBar, CssBaseline, Toolbar, List, Typography, Divider, ListItem, ListItemButton, ListItemIcon, ListItemText, Button } from '@mui/material';
import { Outlet, useNavigate } from 'react-router-dom';
import PersonIcon from '@mui/icons-material/Person';
import InventoryIcon from '@mui/icons-material/Inventory';

import FolderOpenIcon from '@mui/icons-material/FolderOpen';
import SaveIcon from '@mui/icons-material/Save';
import PublicIcon from '@mui/icons-material/Public';
import { useSaveStore } from '../store/useSaveStore';
import { useNotification } from '../context/NotificationContext';

const drawerWidth = 240;

export default function MainLayout() {
  const navigate = useNavigate();
  const currentFilePath = useSaveStore((state) => state.currentFilePath);
  const saveData = useSaveStore((state) => state.saveData);
  const loadSaveData = useSaveStore((state) => state.loadSaveData);
  const { showNotification } = useNotification();

  const handleOpenFile = async () => {
    try {
      const result = await window.ipcRenderer.openSaveData();
      if (result.success && result.filePath && result.data) {
        loadSaveData(result.filePath, result.data);
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
      const result = await window.ipcRenderer.saveData(currentFilePath, saveData);
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
            Master Save
          </Button>
        </Toolbar>
      </AppBar>
      <Drawer
        variant="permanent"
        sx={{
          width: drawerWidth,
          flexShrink: 0,
          [`& .MuiDrawer-paper`]: { width: drawerWidth, boxSizing: 'border-box' },
        }}
      >
        <Toolbar />
        <Box sx={{ overflow: 'auto' }}>
          <List>
            <ListItem disablePadding>
              <ListItemButton onClick={() => navigate('/')}>
                <ListItemIcon>
                  <PersonIcon />
                </ListItemIcon>
                <ListItemText primary="Character Stats" />
              </ListItemButton>
            </ListItem>
            <ListItem disablePadding>
              <ListItemButton onClick={() => navigate('/inventory')}>
                <ListItemIcon>
                  <InventoryIcon />
                </ListItemIcon>
                <ListItemText primary="Inventory" />
              </ListItemButton>
            </ListItem>

            <ListItem disablePadding>
              <ListItemButton onClick={() => navigate('/globals')}>
                <ListItemIcon>
                  <PublicIcon />
                </ListItemIcon>
                <ListItemText primary="Global Variables" />
              </ListItemButton>
            </ListItem>
          </List>
          <Divider />
        </Box>
      </Drawer>
      <Box component="main" sx={{ flexGrow: 1, p: 3 }}>
        <Toolbar />
        <Outlet />
      </Box>
    </Box>
  );
}
