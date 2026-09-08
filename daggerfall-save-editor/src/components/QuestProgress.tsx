import React, { useState, useMemo } from 'react';
import { 
  Box, Typography, Paper, TextField, List, ListItem, ListItemText, Switch, Divider, InputAdornment, Tooltip, Stack, Select, MenuItem, FormControl, InputLabel
} from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';
import InfoOutlinedIcon from '@mui/icons-material/InfoOutlined';
import { useSaveStore } from '../store/useSaveStore';

export const QuestProgress = () => {
  const saveData = useSaveStore((state) => state.saveData);
  const updateGlobalVar = useSaveStore((state) => state.updateGlobalVar);
  
  const [searchQuery, setSearchQuery] = useState('');
  const [filterState, setFilterState] = useState<'all' | 'active' | 'inactive'>('all');

  if (!saveData || !saveData.playerData?.playerEntity?.globalVars) {
    return null;
  }

  const globalVars = saveData.playerData.playerEntity.globalVars || [];

  const filteredVars = useMemo(() => {
    let result = globalVars;

    // Apply state filter
    if (filterState === 'active') {
      result = result.filter(v => v.value === true);
    } else if (filterState === 'inactive') {
      result = result.filter(v => v.value === false);
    }

    // Apply text search
    if (searchQuery) {
      const lowerQuery = searchQuery.toLowerCase();
      result = result.filter(v => v.name.toLowerCase().includes(lowerQuery));
    }

    return result;
  }, [globalVars, searchQuery, filterState]);

  return (
    <Paper sx={{ p: 3, borderRadius: 2, display: 'flex', flexDirection: 'column', backgroundImage: 'linear-gradient(rgba(244, 143, 177, 0.05), rgba(255, 255, 255, 0))' }}>
      <Typography variant="h5" color="secondary.main" gutterBottom>
        Quest Progress & Global Flags
      </Typography>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
        Modify quest states and global flags. Be careful, as changing these might break quest progression!
      </Typography>

      <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} sx={{ mb: 2 }}>
        <TextField
          sx={{ flex: 1 }}
          variant="outlined"
          placeholder="Search global variables..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          fullWidth
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

        <FormControl sx={{ minWidth: 150 }}>
          <InputLabel id="filter-state-label">State Filter</InputLabel>
          <Select
            labelId="filter-state-label"
            value={filterState}
            label="State Filter"
            onChange={(e) => setFilterState(e.target.value as any)}
          >
            <MenuItem value="all">All</MenuItem>
            <MenuItem value="active">Active (True)</MenuItem>
            <MenuItem value="inactive">Inactive (False)</MenuItem>
          </Select>
        </FormControl>
      </Stack>

      <Box sx={{ flexGrow: 1, overflowY: 'auto', maxHeight: 600, pr: 1 }}>
        <List disablePadding dense>
          {filteredVars.map((gvar, index) => {
            const isUnused = gvar.name.toLowerCase().startsWith('unused');
            return (
              <React.Fragment key={gvar.name}>
                <ListItem sx={{ py: 1 }}>
                  <ListItemText 
                    primary={
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <Typography sx={{ fontWeight: gvar.value ? 'bold' : 'normal', color: gvar.value ? 'primary.main' : 'text.primary' }}>
                          {gvar.name}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          (Index: {index})
                        </Typography>
                        {isUnused && (
                          <Tooltip title="Warning: Usually unused in the base game, but may be utilized by specific mods.">
                            <InfoOutlinedIcon fontSize="small" color="disabled" />
                          </Tooltip>
                        )}
                      </Box>
                    }
                    secondary={isUnused ? 'Unused flag' : null}
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
            );
          })}
          {filteredVars.length === 0 && (
            <Typography color="text.secondary" sx={{ py: 4, textAlign: 'center' }}>
              No global variables match your filters.
            </Typography>
          )}
        </List>
      </Box>
    </Paper>
  );
};
