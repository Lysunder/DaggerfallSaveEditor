import { useEffect, useMemo, useState } from 'react';
import {
  Alert, Box, Button, Chip, CircularProgress, Divider, IconButton, InputAdornment, List, ListItemButton,
  ListItemText, ListSubheader, Menu, MenuItem, Paper, Stack, TextField, Tooltip, Typography,
} from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';
import RefreshIcon from '@mui/icons-material/Refresh';
import FolderOpenIcon from '@mui/icons-material/FolderOpen';
import PlaceIcon from '@mui/icons-material/Place';
import DeleteIcon from '@mui/icons-material/Delete';
import WarningAmberIcon from '@mui/icons-material/WarningAmber';
import ImageNotSupportedIcon from '@mui/icons-material/ImageNotSupported';
import type { AddLocationResult, SaveLocation, SaveSlot } from '../../electron/saveTypes';
import { useSaveLoader } from '../hooks/useSaveLoader';
import { useNotification } from '../context/NotificationContext';
import { formatGameTime, ticksToDate } from '../utils/daggerfallDate';

const THUMB_WIDTH = 112;
const THUMB_HEIGHT = 63;

const Screenshot = ({ slot }: { slot: SaveSlot }) => {
  const [src, setSrc] = useState<string | null>(null);

  useEffect(() => {
    if (!slot.hasScreenshot) return;
    let cancelled = false;
    window.ipcRenderer.getSaveScreenshot(slot.folder).then(
      (url) => !cancelled && setSrc(url),
      () => undefined,
    );
    return () => {
      cancelled = true;
    };
  }, [slot.folder, slot.hasScreenshot]);

  return (
    <Box
      sx={{
        width: THUMB_WIDTH, height: THUMB_HEIGHT, flexShrink: 0, mr: 2, borderRadius: 1, overflow: 'hidden',
        bgcolor: 'action.hover', display: 'flex', alignItems: 'center', justifyContent: 'center',
      }}
    >
      {src ? (
        <Box component="img" src={src} alt="" sx={{ width: '100%', height: '100%', objectFit: 'cover' }} />
      ) : (
        <ImageNotSupportedIcon color="disabled" />
      )}
    </Box>
  );
};

const describeSlot = (slot: SaveSlot, locationLabel?: string) => {
  const parts: string[] = [];
  if (slot.info) {
    parts.push(formatGameTime(slot.info.dateAndTime.gameTime));
    parts.push(`saved ${ticksToDate(slot.info.dateAndTime.realTime).toLocaleString()}`);
    if (slot.info.dfuVersion) parts.push(`DFU ${slot.info.dfuVersion}`);
  }
  parts.push(slot.folderName);
  if (locationLabel) parts.push(locationLabel);
  return parts.join(' · ');
};

const newestFirst = (a: SaveSlot, b: SaveSlot) =>
  (b.info?.dateAndTime.realTime ?? 0) - (a.info?.dateAndTime.realTime ?? 0);

/** Lists Daggerfall Unity saves from every known location and loads the one clicked. */
export const SaveBrowser = ({ onLoaded }: { onLoaded?: () => void }) => {
  const { openFile, loadSlot } = useSaveLoader();
  const { showNotification } = useNotification();

  const [locations, setLocations] = useState<SaveLocation[]>([]);
  const [saves, setSaves] = useState<SaveSlot[]>([]);
  const [scanning, setScanning] = useState(true);
  const [scanError, setScanError] = useState<string | null>(null);
  const [scanCount, setScanCount] = useState(0);
  const [search, setSearch] = useState('');
  const [hiddenLocations, setHiddenLocations] = useState<Set<string>>(new Set());
  const [loadingFolder, setLoadingFolder] = useState<string | null>(null);
  const [menuAnchor, setMenuAnchor] = useState<HTMLElement | null>(null);

  const refresh = () => {
    setScanning(true);
    setScanCount((count) => count + 1);
  };

  useEffect(() => {
    let cancelled = false;
    window.ipcRenderer.scanSaves().then(
      (result) => {
        if (cancelled) return;
        setLocations(result.locations);
        setSaves(result.saves);
        setScanError(null);
        setScanning(false);
      },
      (error: Error) => {
        if (cancelled) return;
        setScanError(error.message);
        setScanning(false);
      },
    );
    return () => {
      cancelled = true;
    };
  }, [scanCount]);

  const usableLocations = locations.filter((location) => location.root);
  const showLocationLabels = usableLocations.length > 1;
  const labelFor = (id: string) => locations.find((location) => location.id === id)?.label;

  const groups = useMemo(() => {
    const query = search.trim().toLowerCase();
    const visible = saves.filter((slot) => {
      if (hiddenLocations.has(slot.locationId)) return false;
      if (!query) return true;
      return [slot.info?.characterName, slot.info?.saveName, slot.folderName]
        .some((text) => text?.toLowerCase().includes(query));
    });

    // Grouped by character like DFU's load screen; unreadable saves get their own group at the end.
    const byCharacter = new Map<string, SaveSlot[]>();
    for (const slot of visible) {
      const key = slot.info ? slot.info.characterName : '';
      byCharacter.set(key, [...(byCharacter.get(key) ?? []), slot]);
    }
    return [...byCharacter.entries()]
      .map(([character, slots]) => ({ character, slots: slots.sort(newestFirst) }))
      .sort((a, b) => {
        if (!a.character) return 1;
        if (!b.character) return -1;
        return newestFirst(a.slots[0], b.slots[0]);
      });
  }, [saves, search, hiddenLocations]);

  const handleAdd = async (add: () => Promise<AddLocationResult>) => {
    setMenuAnchor(null);
    try {
      const result = await add();
      if (result.canceled) return;
      if (result.error) {
        showNotification(result.error, 'error');
        return;
      }
      if (result.message) showNotification(result.message, 'info');
      else if (result.location) showNotification(`Added ${result.location.label}`, 'success');
      refresh();
    } catch (error: any) {
      showNotification(`Couldn't add the location: ${error.message}`, 'error');
    }
  };

  const handleRemove = async (location: SaveLocation) => {
    await window.ipcRenderer.removeSaveLocation(location.id);
    showNotification(`Removed ${location.label}`, 'info');
    refresh();
  };

  const handleOpen = async (slot: SaveSlot) => {
    setLoadingFolder(slot.folder);
    const loaded = await loadSlot(slot.folder);
    setLoadingFolder(null);
    if (loaded) onLoaded?.();
  };

  const toggleLocation = (id: string) =>
    setHiddenLocations((current) => {
      const next = new Set(current);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });

  const addButtons = (
    <>
      <Button variant="outlined" onClick={() => handleAdd(window.ipcRenderer.addSaveInstall)}>Add DFU install folder…</Button>
      <Button variant="outlined" onClick={() => handleAdd(window.ipcRenderer.addSaveFolder)}>Add saves folder…</Button>
      <Button startIcon={<FolderOpenIcon />} onClick={openFile}>Open a save file…</Button>
    </>
  );

  return (
    <Box>
      <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1} sx={{ mb: 2, alignItems: { sm: 'center' } }}>
        <Typography variant="h5" sx={{ flexGrow: 1 }}>Daggerfall Unity Saves</Typography>
        <TextField
          size="small"
          placeholder="Search character or save name"
          value={search}
          onChange={(event) => setSearch(event.target.value)}
          slotProps={{ input: { startAdornment: <InputAdornment position="start"><SearchIcon fontSize="small" /></InputAdornment> } }}
        />
        <Tooltip title="Rescan save folders">
          <span>
            <IconButton onClick={refresh} disabled={scanning}><RefreshIcon /></IconButton>
          </span>
        </Tooltip>
        <Button startIcon={<PlaceIcon />} onClick={(event) => setMenuAnchor(event.currentTarget)}>Locations</Button>
        <Button startIcon={<FolderOpenIcon />} onClick={openFile}>Open file…</Button>
      </Stack>

      <Menu anchorEl={menuAnchor} open={!!menuAnchor} onClose={() => setMenuAnchor(null)}>
        {locations.map((location) => (
          <MenuItem key={location.id} disableRipple sx={{ cursor: 'default', maxWidth: 520 }}>
            <ListItemText
              primary={location.label}
              secondary={location.root ?? location.warning}
              slotProps={{ secondary: { sx: { wordBreak: 'break-all' } } }}
            />
            {location.removable && (
              <Tooltip title="Remove this location">
                <IconButton edge="end" size="small" onClick={() => { setMenuAnchor(null); handleRemove(location); }}>
                  <DeleteIcon fontSize="small" />
                </IconButton>
              </Tooltip>
            )}
          </MenuItem>
        ))}
        <Divider />
        <MenuItem onClick={() => handleAdd(window.ipcRenderer.addSaveInstall)}>Add DFU install folder…</MenuItem>
        <MenuItem onClick={() => handleAdd(window.ipcRenderer.addSaveFolder)}>Add saves folder…</MenuItem>
      </Menu>

      {scanError && <Alert severity="error" sx={{ mb: 2 }}>Couldn't scan save folders: {scanError}</Alert>}

      {locations
        // A missing default folder is normal for portable-only players; the empty state covers it.
        .filter((location) => location.warning && (location.removable || location.root))
        .map((location) => (
          <Alert
            key={location.id}
            severity={location.root ? 'info' : 'warning'}
            icon={location.root ? undefined : <WarningAmberIcon />}
            sx={{ mb: 1 }}
            action={location.removable ? <Button color="inherit" size="small" onClick={() => handleRemove(location)}>Remove</Button> : undefined}
          >
            <strong>{location.label}:</strong> {location.warning}
          </Alert>
        ))}

      {showLocationLabels && (
        <Stack direction="row" spacing={1} sx={{ mb: 2, flexWrap: 'wrap' }} useFlexGap>
          {usableLocations.map((location) => (
            <Chip
              key={location.id}
              label={location.label}
              color={hiddenLocations.has(location.id) ? 'default' : 'primary'}
              variant={hiddenLocations.has(location.id) ? 'outlined' : 'filled'}
              onClick={() => toggleLocation(location.id)}
            />
          ))}
        </Stack>
      )}

      <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 2 }}>
        Edit saves while Daggerfall Unity is closed, or reload the save in the game after editing. The game overwrites
        QuickSave and AutoSave slots on its own.
      </Typography>

      {scanning && saves.length === 0 ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 6 }}><CircularProgress /></Box>
      ) : saves.length === 0 ? (
        <Paper variant="outlined" sx={{ p: 4, textAlign: 'center' }}>
          <Typography variant="h6" gutterBottom>Couldn't find your Daggerfall Unity saves</Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
            If you use a portable install, point the editor at its install folder. You can also add any folder that
            contains save folders, or open a SaveData.txt directly.
          </Typography>
          <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1} sx={{ justifyContent: 'center' }}>{addButtons}</Stack>
        </Paper>
      ) : groups.length === 0 ? (
        <Typography color="text.secondary" sx={{ py: 4, textAlign: 'center' }}>No saves match “{search}”.</Typography>
      ) : (
        <Paper variant="outlined">
          <List disablePadding>
            {groups.map(({ character, slots }) => (
              <li key={character || 'unreadable'}>
                <ul style={{ padding: 0 }}>
                  <ListSubheader sx={{ bgcolor: 'background.paper' }}>
                    {character || 'Unreadable saves'} · {slots.length} {slots.length === 1 ? 'save' : 'saves'}
                  </ListSubheader>
                  {slots.map((slot) => (
                    <ListItemButton
                      key={slot.folder}
                      disabled={!slot.info || !!loadingFolder}
                      onClick={() => handleOpen(slot)}
                      sx={{ py: 1 }}
                    >
                      <Screenshot slot={slot} />
                      <ListItemText
                        primary={slot.info?.saveName ?? slot.folderName}
                        secondary={slot.error ?? describeSlot(slot, showLocationLabels ? labelFor(slot.locationId) : undefined)}
                      />
                      {loadingFolder === slot.folder && <CircularProgress size={20} sx={{ ml: 2 }} />}
                    </ListItemButton>
                  ))}
                </ul>
              </li>
            ))}
          </List>
        </Paper>
      )}
    </Box>
  );
};
