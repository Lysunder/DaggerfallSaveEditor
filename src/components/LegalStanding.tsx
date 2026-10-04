import { useMemo, useState } from 'react';
import {
  Box, Paper, Typography, Stack, Button, Chip, FormControl, InputLabel, Select, MenuItem, FormControlLabel, Switch, Tooltip, IconButton,
} from '@mui/material';
import { DataGrid, type GridColDef, type GridRenderCellParams } from '@mui/x-data-grid';
import GavelIcon from '@mui/icons-material/Gavel';
import LockOpenIcon from '@mui/icons-material/LockOpen';
import { useSaveStore } from '../store/useSaveStore';
import { useNotification } from '../context/NotificationContext';
import { REGION_NAMES } from '../data/regions';
import {
  CRIMES, LEGAL_REP_MAX, LEGAL_REP_MIN, crimeLabel, crimeName, hasLegalTrouble, legalStanding, punishmentLabel,
} from '../data/legal';

interface Row {
  id: number;
  region: string;
  rep: number;
  punishment: number;
}

export const LegalStanding = () => {
  const playerEntity = useSaveStore((state) => state.saveData?.playerData?.playerEntity);
  const updateRegionLegal = useSaveStore((state) => state.updateRegionLegal);
  const setCrimeCommitted = useSaveStore((state) => state.setCrimeCommitted);
  const clearLegalTrouble = useSaveStore((state) => state.clearLegalTrouble);
  const { showNotification } = useNotification();
  const [showAll, setShowAll] = useState(false);

  const regionData = playerEntity?.regionData;

  const allRows = useMemo<Row[]>(
    () =>
      (regionData ?? []).map((region, index) => ({
        id: index,
        region: REGION_NAMES[index] ?? `Region ${index}`,
        rep: typeof region?.LegalRep === 'number' ? region.LegalRep : 0,
        punishment: typeof region?.SeverePunishmentFlags === 'number' ? region.SeverePunishmentFlags : 0,
      })),
    [regionData],
  );

  if (!playerEntity) return null;

  // Saves from before DFU tracked regions have no usable regionData; DFU rebuilds it on load.
  if (!Array.isArray(regionData) || regionData.length === 0) {
    return (
      <Paper sx={{ p: 3, borderRadius: 2 }}>
        <Typography variant="h5" color="error.light" gutterBottom>Crime & Legal Standing</Typography>
        <Typography color="text.secondary">This save has no regional legal records.</Typography>
      </Paper>
    );
  }

  const currentCrime = crimeName(playerEntity.crimeCommitted) ?? 'None';
  const troubled = regionData.filter(hasLegalTrouble).length;
  const hasTrouble = troubled > 0 || currentCrime !== 'None';
  const rows = showAll ? allRows : allRows.filter((row) => row.rep !== 0 || row.punishment !== 0);

  const handleClearAll = () => {
    clearLegalTrouble();
    const parts = [];
    if (currentCrime !== 'None') parts.push('the current crime');
    if (troubled > 0) parts.push(`${troubled} ${troubled === 1 ? 'region' : 'regions'}`);
    showNotification(`Cleared ${parts.join(' and ')}.`, 'success');
  };

  const processRowUpdate = (newRow: Row, oldRow: Row) => {
    const value = Number(newRow.rep);
    // An emptied cell arrives as null; keep the old value rather than writing something DFU can't read.
    const rep = Number.isFinite(value) && newRow.rep !== null
      ? Math.max(LEGAL_REP_MIN, Math.min(LEGAL_REP_MAX, Math.trunc(value)))
      : oldRow.rep;
    if (rep !== oldRow.rep) updateRegionLegal(newRow.id, { LegalRep: rep });
    return { ...newRow, rep };
  };

  const columns: GridColDef<Row>[] = [
    { field: 'region', headerName: 'Region', flex: 1, minWidth: 160 },
    {
      field: 'rep',
      headerName: 'Legal Reputation',
      type: 'number',
      width: 150,
      editable: true,
      description: `Double-click to edit (${LEGAL_REP_MIN} to ${LEGAL_REP_MAX})`,
    },
    {
      field: 'standing',
      headerName: 'In the Eyes of the Law',
      width: 190,
      valueGetter: (_, row) => legalStanding(row.rep),
      renderCell: (params: GridRenderCellParams<Row>) => (
        <Typography variant="body2" color={params.row.rep < 0 ? 'error.light' : 'text.primary'} sx={{ lineHeight: 'inherit' }}>
          {legalStanding(params.row.rep)}
        </Typography>
      ),
    },
    {
      field: 'punishment',
      headerName: 'Punishment',
      width: 230,
      sortable: false,
      renderCell: (params: GridRenderCellParams<Row>) =>
        params.row.punishment ? (
          <Stack direction="row" spacing={1} sx={{ alignItems: 'center', height: '100%' }}>
            <Chip label={punishmentLabel(params.row.punishment)} color="error" size="small" />
            <Tooltip title="Lift the punishment">
              <IconButton size="small" onClick={() => updateRegionLegal(params.row.id, { SeverePunishmentFlags: 0 })}>
                <LockOpenIcon fontSize="small" />
              </IconButton>
            </Tooltip>
          </Stack>
        ) : null,
    },
  ];

  return (
    <Paper sx={{ p: 3, borderRadius: 2, display: 'flex', flexDirection: 'column', gap: 2 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 2 }}>
        <Typography variant="h5" color="error.light">
          Crime & Legal Standing
        </Typography>
        <Button
          variant="outlined"
          color="warning"
          startIcon={<GavelIcon />}
          onClick={handleClearAll}
          disabled={!hasTrouble}
        >
          Clear All Bounties
        </Button>
      </Box>
      <Typography variant="body2" color="text.secondary">
        Each region keeps its own legal reputation. Below -10, and while you're banished, the city
        watch may come after you there. Clearing resets negative reputations to 0, lifts banishments and death
        sentences, and clears the crime you're wanted for. Positive reputations are kept. Your standing with each
        region's people is a separate faction reputation, under All Faction Reputations.
      </Typography>

      <Stack direction="row" spacing={2} sx={{ alignItems: 'center', flexWrap: 'wrap' }}>
        <FormControl size="small" sx={{ minWidth: 260 }}>
          <InputLabel id="crime-select-label">Wanted for</InputLabel>
          <Select
            labelId="crime-select-label"
            label="Wanted for"
            value={currentCrime}
            onChange={(e) => setCrimeCommitted(e.target.value)}
          >
            {CRIMES.map((crime) => (
              <MenuItem key={crime.name} value={crime.name}>{crime.name === 'None' ? 'Nothing' : crimeLabel(crime.name)}</MenuItem>
            ))}
          </Select>
        </FormControl>
        <FormControlLabel
          control={<Switch checked={showAll} onChange={(e) => setShowAll(e.target.checked)} />}
          label="Show all regions"
        />
      </Stack>

      <Box sx={{ height: 400, width: '100%' }}>
        {rows.length > 0 ? (
          <DataGrid
            rows={rows}
            columns={columns}
            processRowUpdate={processRowUpdate}
            onProcessRowUpdateError={(error: Error) => showNotification(`Error updating legal reputation: ${error.message}`, 'error')}
            initialState={{ pagination: { paginationModel: { pageSize: 25 } } }}
            pageSizeOptions={[25, 62]}
            disableRowSelectionOnClick
            density="compact"
          />
        ) : (
          <Typography color="text.secondary">
            Every region sees you as a common citizen. Turn on "Show all regions" to edit one.
          </Typography>
        )}
      </Box>
    </Paper>
  );
};
