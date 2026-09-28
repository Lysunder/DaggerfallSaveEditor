import { useState } from 'react';
import {
  Box, Paper, Typography, Tabs, Tab, TextField, InputAdornment, Stack, Chip, Divider
} from '@mui/material';
import { DataGrid } from '@mui/x-data-grid';
import type { GridColDef, GridRenderCellParams } from '@mui/x-data-grid';
import { useSaveStore } from '../store/useSaveStore';
import type { BankAccount } from '../store/useSaveStore';
import { REGION_NAMES } from '../data/regions';

export const FinancesAndBanking = () => {
  const saveData = useSaveStore((state) => state.saveData);
  const updatePlayerField = useSaveStore((state) => state.updatePlayerField);
  const updateBankAccount = useSaveStore((state) => state.updateBankAccount);

  const [tabIndex, setTabIndex] = useState(0);

  if (!saveData || !saveData.playerData?.playerEntity) return null;

  const { playerEntity } = saveData.playerData;
  const bankAccounts = saveData.bankAccounts || [];
  const bankDeeds = saveData.bankDeeds || { shipType: -1, houses: [] };

  const handleGoldChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = parseInt(e.target.value, 10);
    if (!isNaN(val)) {
      updatePlayerField('goldPieces', Math.max(0, val));
    }
  };

  const processRowUpdate = (newRow: BankAccount, oldRow: BankAccount) => {
    if (newRow.accountGold !== oldRow.accountGold || newRow.loanTotal !== oldRow.loanTotal) {
      updateBankAccount(newRow.regionIndex, {
        accountGold: newRow.accountGold,
        loanTotal: newRow.loanTotal
      });
    }
    return newRow;
  };

  const handleProcessRowUpdateError = (error: Error) => {
    console.error("Error updating bank account:", error);
  };

  const columns: GridColDef[] = [
    { 
      field: 'regionName', 
      headerName: 'Region Name', 
      flex: 1, 
      minWidth: 150,
      valueGetter: (_, row) => REGION_NAMES[row.regionIndex] || `Unknown (${row.regionIndex})`
    },
    { field: 'regionIndex', headerName: 'Region Index', width: 120 },
    { 
      field: 'accountGold', 
      headerName: 'Account Balance', 
      type: 'number', 
      width: 150, 
      editable: true 
    },
    { 
      field: 'loanTotal', 
      headerName: 'Loan Total', 
      type: 'number', 
      width: 130, 
      editable: true 
    },
    { field: 'loanDueDate', headerName: 'Loan Due Date', type: 'number', width: 130 },
    {
      field: 'hasDefaulted',
      headerName: 'Default Status',
      width: 130,
      renderCell: (params: GridRenderCellParams) => (
        params.row.hasDefaulted 
          ? <Chip label="Defaulted" color="error" size="small" /> 
          : <Chip label="Good Standing" color="success" size="small" />
      )
    }
  ];

  return (
    <Paper sx={{ p: 3, borderRadius: 2, display: 'flex', flexDirection: 'column', gap: 3, backgroundImage: 'linear-gradient(rgba(244, 143, 177, 0.05), rgba(255, 255, 255, 0))' }}>
      <Typography variant="h5" color="secondary.main" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
        Finances & Banking
      </Typography>
      
      <Box>
        <Typography variant="subtitle1" gutterBottom>Personal Wealth</Typography>
        <TextField
          label="Carried Gold"
          type="number"
          value={playerEntity.goldPieces || 0}
          onChange={handleGoldChange}
          slotProps={{
            input: {
              startAdornment: <InputAdornment position="start">G</InputAdornment>,
            }
          }}
          sx={{ maxWidth: 300 }}
        />
      </Box>

      <Divider />

      <Box sx={{ flexGrow: 1, display: 'flex', flexDirection: 'column', gap: 2 }}>
        <Tabs value={tabIndex} onChange={(_, v) => setTabIndex(v)}>
          <Tab label="Bank Accounts" />
          <Tab label="Bank Deeds" />
        </Tabs>

        {tabIndex === 0 && (
          <Box sx={{ height: 400, width: '100%' }}>
            {bankAccounts.length > 0 ? (
              <DataGrid
                rows={bankAccounts}
                columns={columns}
                getRowId={(row) => row.regionIndex}
                processRowUpdate={processRowUpdate}
                onProcessRowUpdateError={handleProcessRowUpdateError}
                initialState={{
                  pagination: { paginationModel: { pageSize: 10 } },
                }}
                pageSizeOptions={[10, 25, 62]}
                disableRowSelectionOnClick
                density="compact"
              />
            ) : (
              <Typography color="text.secondary">No bank accounts found in save data.</Typography>
            )}
          </Box>
        )}

        {tabIndex === 1 && (
          <Box sx={{ minHeight: 200 }}>
            {bankDeeds.houses && bankDeeds.houses.length > 0 ? (
              <Stack spacing={2}>
                {bankDeeds.houses.map((house, idx) => (
                  <Paper key={idx} sx={{ p: 2 }} variant="outlined">
                    <Typography>House Deed #{idx + 1}</Typography>
                    <Typography variant="body2" color="text.secondary">
                      {JSON.stringify(house)}
                    </Typography>
                  </Paper>
                ))}
              </Stack>
            ) : (
              <Typography color="text.secondary">No houses owned.</Typography>
            )}
          </Box>
        )}
      </Box>
    </Paper>
  );
};
