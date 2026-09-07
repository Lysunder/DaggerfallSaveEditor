import React, { useState, useMemo } from 'react';
import { Box, Typography, Paper, TextField, List, ListItem, ListItemText, Switch, Divider, InputAdornment } from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';
import { useSaveStore } from '../store/useSaveStore';

export default function GlobalVars() {
  const saveData = useSaveStore((state) => state.saveData);
  const updateGlobalVar = useSaveStore((state) => state.updateGlobalVar);
  const [searchQuery, setSearchQuery] = useState('');

  if (!saveData || !saveData.playerData?.playerEntity?.globalVars) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%' }}>
        <Typography variant="h5" color="text.secondary">
          No global variables found. Please open a valid Daggerfall Unity save file.
        </Typography>
      </Box>
    );
  }

  const globalVars = saveData.playerData.playerEntity.globalVars || [];

  const filteredVars = useMemo(() => {
    if (!searchQuery) return globalVars;
    const lowerQuery = searchQuery.toLowerCase();
    return globalVars.filter((v) => v.name.toLowerCase().includes(lowerQuery));
  }, [globalVars, searchQuery]);

  return (
    <Box sx={{ pb: 4, height: '100%', display: 'flex', flexDirection: 'column' }}>
      <Typography variant="h4" gutterBottom sx={{ fontWeight: 'bold' }}>
        Global Variables
      </Typography>
      <Typography variant="body1" color="text.secondary" gutterBottom>
        Modify quest states and global flags. Be careful, as changing these might break quest progression!
      </Typography>

      <Paper sx={{ p: 3, mt: 2, display: 'flex', flexDirection: 'column', flexGrow: 1, minHeight: 0 }}>
        <TextField
          fullWidth
          variant="outlined"
          placeholder="Search global variables..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          sx={{ mb: 3 }}
          slotProps={{
            input: {
              startAdornment: (
                <InputAdornment position="start">
                  <SearchIcon />
                </InputAdornment>
              ),
            }
          }}
        />

        <Box sx={{ flexGrow: 1, overflowY: 'auto', pr: 2 }}>
          <List disablePadding>
            {filteredVars.map((gvar, index) => (
              <React.Fragment key={gvar.name}>
                <ListItem sx={{ py: 1.5 }}>
                  <ListItemText 
                    primary={gvar.name} 
                    slotProps={{ primary: { sx: { fontWeight: gvar.value ? 'bold' : 'normal' } } }}
                  />
                  <Switch
                    edge="end"
                    color="primary"
                    checked={!!gvar.value}
                    onChange={(e) => updateGlobalVar(gvar.name, e.target.checked)}
                  />
                </ListItem>
                {index < filteredVars.length - 1 && <Divider />}
              </React.Fragment>
            ))}
            {filteredVars.length === 0 && (
              <Typography color="text.secondary" sx={{ py: 2, textAlign: 'center' }}>
                No global variables match your search.
              </Typography>
            )}
          </List>
        </Box>
      </Paper>
    </Box>
  );
}
