import { useMemo } from 'react';
import { Box, Typography, Paper } from '@mui/material';
import { DataGrid, type GridColDef, type GridRowModel } from '@mui/x-data-grid';
import { useSaveStore } from '../store/useSaveStore';
import { useNotification } from '../context/NotificationContext';

export const AllReputations = () => {
  const factionData = useSaveStore((state) => state.factionData);
  const updateFactionReputation = useSaveStore((state) => state.updateFactionReputation);
  const { showNotification } = useNotification();

  if (!factionData || !factionData.factionDict || !Array.isArray(factionData.factionDict)) {
    return null;
  }

  const rows = useMemo(() => {
    return factionData.factionDict.map((item: any) => ({
      id: item.Key,
      name: item.Value?.name || `Faction ${item.Key}`,
      type: item.Value?.type ?? 'Unknown',
      region: item.Value?.region ?? 'Unknown',
      rep: item.Value?.rep ?? 0,
    }));
  }, [factionData.factionDict]);

  const columns: GridColDef[] = [
    { field: 'id', headerName: 'Faction ID', width: 100 },
    { field: 'name', headerName: 'Name', flex: 1, minWidth: 200 },
    { field: 'type', headerName: 'Type', width: 100 },
    { field: 'region', headerName: 'Region', width: 100 },
    { 
      field: 'rep', 
      headerName: 'Reputation', 
      width: 150, 
      editable: true,
      type: 'number',
      description: 'Editable reputation (-100 to 100)'
    },
  ];

  const processRowUpdate = (newRow: GridRowModel, oldRow: GridRowModel) => {
    let newRep = Number(newRow.rep);
    if (isNaN(newRep)) {
      newRep = oldRow.rep;
    }
    // Clamp between -100 and 100
    newRep = Math.max(-100, Math.min(100, newRep));

    if (newRep !== oldRow.rep) {
      updateFactionReputation(newRow.id, newRep);
      showNotification(`Updated ${newRow.name} reputation to ${newRep}`, 'success');
    }
    
    return { ...newRow, rep: newRep };
  };

  const handleProcessRowUpdateError = (error: Error) => {
    showNotification(`Error updating reputation: ${error.message}`, 'error');
  };

  return (
    <Paper sx={{ p: 3, borderRadius: 2, display: 'flex', flexDirection: 'column' }}>
      <Typography variant="h5" color="primary.light" gutterBottom>
        All Faction Reputations
      </Typography>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
        Double-click the Reputation cell to edit the value (from -100 to 100). This affects generic and unique NPCs associated with these factions.
      </Typography>
      <Box sx={{ height: 400, width: '100%' }}>
        <DataGrid
          rows={rows}
          columns={columns}
          initialState={{
            pagination: {
              paginationModel: { pageSize: 100, page: 0 },
            },
          }}
          pageSizeOptions={[25, 50, 100, 500]}
          processRowUpdate={processRowUpdate}
          onProcessRowUpdateError={handleProcessRowUpdateError}
          disableRowSelectionOnClick
          density="compact"
        />
      </Box>
    </Paper>
  );
};
