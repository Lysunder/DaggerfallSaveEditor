import { useState } from 'react';
import {
  Box, Paper, Typography, Tabs, Tab, TextField, InputAdornment, Stack, Chip, Divider
} from '@mui/material';
import { DataGrid } from '@mui/x-data-grid';
import type { GridColDef, GridRenderCellParams } from '@mui/x-data-grid';
import { useSaveStore } from '../store/useSaveStore';
import type { BankAccount } from '../store/useSaveStore';

const REGION_NAMES: Record<number, string> = {
  0: "Alik'r Desert", 1: "Dragontail Mountains", 2: "Glenpoint Foothills", 3: "Daggerfall Bluffs",
  4: "Yeorth Burrowland", 5: "Dwynnen", 6: "Ravennian Mountains", 7: "Wrothgarian Mountains",
  8: "Forsaken Wastes", 9: "Betony", 10: "Sentinelian Mountains", 11: "Tigonus", 12: "Kozanset",
  13: "Gavaudon", 14: "Tulune", 15: "Glenumbra Moors", 16: "Ilessan Hills", 17: "Daggerfall",
  18: "Shalgora", 19: "Kambria", 20: "Sentinel", 21: "Anticlere", 22: "Lainlyn", 23: "Wayrest",
  24: "GenTemHighRock", 25: "GenTemHammerfell", 26: "Orsinium Area", 27: "Skeffington Wood",
  28: "Hammerfell bay", 29: "Hammerfell coast", 30: "High Rock bay", 31: "High Rock sea",
  32: "Iliac Bay", 33: "Shalgora", 34: "Wrothgarian Mountains", 35: "Dragontail", 36: "Wayrest",
  37: "Orsinium", 38: "Daggerfall", 39: "Sentinel", 40: "Glenpoint", 41: "Betony",
  42: "Sentinelian Mountains", 43: "Tigonus", 44: "Kozanset", 45: "Gavaudon", 46: "Tulune",
  47: "Glenumbra Moors", 48: "Ilessan Hills", 49: "Shalgora", 50: "Kambria", 51: "Anticlere",
  52: "Lainlyn", 53: "Wayrest", 54: "Skeffington Wood", 55: "Alik'r Desert", 56: "Dragontail Mountains",
  57: "Glenpoint Foothills", 58: "Daggerfall Bluffs", 59: "Yeorth Burrowland", 60: "Dwynnen",
  61: "Ravennian Mountains",
};

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
