import React, { useState, useMemo } from 'react';
import {
  Box, Paper, Typography, Tabs, Tab, TextField, Select, MenuItem,
  FormControl, InputLabel, Button, IconButton, Tooltip, Stack,
  Dialog, DialogTitle, DialogContent, DialogActions, Chip
} from '@mui/material';
import { DataGrid } from '@mui/x-data-grid';
import type { GridColDef, GridRenderCellParams } from '@mui/x-data-grid';
import DeleteIcon from '@mui/icons-material/Delete';
import EditIcon from '@mui/icons-material/Edit';
import BuildIcon from '@mui/icons-material/Build';
import { useSaveStore } from '../store/useSaveStore';
import type { Item } from '../store/useSaveStore';

export const InventoryManager: React.FC = () => {
  // state from store
  const saveData = useSaveStore((state) => state.saveData);
  const updateItem = useSaveStore((state) => state.updateItem);
  const updateWagonItem = useSaveStore((state) => state.updateWagonItem);
  const deleteItem = useSaveStore((state) => state.deleteItem);
  const deleteWagonItem = useSaveStore((state) => state.deleteWagonItem);
  const repairAllItems = useSaveStore((state) => state.repairAllItems);

  // local state
  const [tabIndex, setTabIndex] = useState(0);
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('All');
  
  // Modals state
  const [editItem, setEditItem] = useState<Item | null>(null);
  const [deleteItemId, setDeleteItemId] = useState<number | null>(null);

  if (!saveData?.playerData?.playerEntity) return null;
  
  const { items = [], wagonItems = [], equipTable = [] } = saveData.playerData.playerEntity;

  const currentItems = tabIndex === 0 ? items : wagonItems;
  const isInventory = tabIndex === 0;

  // Derive unique categories
  const categories = useMemo(() => {
    const cats = new Set(currentItems.map(i => i.itemGroup));
    return ['All', ...Array.from(cats)].sort();
  }, [currentItems]);

  // Filter items
  const filteredItems = useMemo(() => {
    return currentItems.filter((item) => {
      const matchName = item.shortName.toLowerCase().includes(searchTerm.toLowerCase());
      const matchCategory = categoryFilter === 'All' || item.itemGroup === categoryFilter;
      return matchName && matchCategory;
    });
  }, [currentItems, searchTerm, categoryFilter]);

  const handleRepairAll = () => {
    repairAllItems(isInventory ? 'items' : 'wagonItems');
  };

  const handleDeleteConfirm = () => {
    if (deleteItemId !== null) {
      if (isInventory) {
        deleteItem(deleteItemId);
      } else {
        deleteWagonItem(deleteItemId);
      }
    }
    setDeleteItemId(null);
  };

  const handleEditSave = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!editItem) return;
    const formData = new FormData(e.currentTarget);
    const updates: Partial<Item> = {
      hits1: parseInt(formData.get('hits1') as string, 10),
      hits2: parseInt(formData.get('hits2') as string, 10),
      stackCount: parseInt(formData.get('stackCount') as string, 10),
      value1: parseInt(formData.get('value1') as string, 10),
      weightInKg: parseFloat(formData.get('weightInKg') as string)
    };

    if (isInventory) {
      updateItem(editItem.uid, updates);
    } else {
      updateWagonItem(editItem.uid, updates);
    }
    setEditItem(null);
  };

  const columns: GridColDef[] = [
    { field: 'shortName', headerName: 'Name', flex: 1, minWidth: 150 },
    { field: 'itemGroup', headerName: 'Category', width: 130 },
    { 
      field: 'durability', 
      headerName: 'Durability', 
      width: 120,
      valueGetter: (_, row) => `${row.hits1} / ${row.hits2}`,
      renderCell: (params: GridRenderCellParams) => (
        <span>{params.row.hits1} / {params.row.hits2}</span>
      )
    },
    { field: 'stackCount', headerName: 'Quantity', type: 'number', width: 100 },
    { field: 'weightInKg', headerName: 'Weight (kg)', type: 'number', width: 120 },
    { field: 'value1', headerName: 'Value', type: 'number', width: 100 },
    {
      field: 'equipped',
      headerName: 'Status',
      width: 120,
      renderCell: (params: GridRenderCellParams) => {
        const isEquipped = equipTable.includes(params.row.uid);
        return isEquipped ? <Chip label="Equipped" color="primary" size="small" /> : null;
      }
    },
    {
      field: 'actions',
      headerName: 'Actions',
      width: 120,
      sortable: false,
      renderCell: (params: GridRenderCellParams) => (
        <Stack direction="row" spacing={1}>
          <Tooltip title="Edit">
            <IconButton size="small" onClick={() => setEditItem(params.row as Item)}>
              <EditIcon fontSize="small" />
            </IconButton>
          </Tooltip>
          <Tooltip title="Delete">
            <IconButton size="small" color="error" onClick={() => setDeleteItemId(params.row.uid)}>
              <DeleteIcon fontSize="small" />
            </IconButton>
          </Tooltip>
        </Stack>
      )
    }
  ];

  return (
    <Paper sx={{ p: 3, borderRadius: 2, display: 'flex', flexDirection: 'column', gap: 2, height: 600 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Tabs value={tabIndex} onChange={(_, v) => setTabIndex(v)}>
          <Tab label="Inventory" />
          <Tab label="Wagon" />
        </Tabs>
        <Button 
          variant="outlined" 
          startIcon={<BuildIcon />} 
          onClick={handleRepairAll}
        >
          Repair All Items
        </Button>
      </Box>

      <Stack direction="row" spacing={2} sx={{ mt: 1 }}>
        <TextField
          size="small"
          label="Search items"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          sx={{ flex: 1 }}
        />
        <FormControl size="small" sx={{ minWidth: 200 }}>
          <InputLabel>Category</InputLabel>
          <Select
            value={categoryFilter}
            label="Category"
            onChange={(e) => setCategoryFilter(e.target.value)}
          >
            {categories.map(c => <MenuItem key={c} value={c}>{c}</MenuItem>)}
          </Select>
        </FormControl>
      </Stack>

      <Box sx={{ flexGrow: 1 }}>
        <DataGrid
          rows={filteredItems}
          columns={columns}
          getRowId={(row) => row.uid}
          initialState={{
            pagination: { paginationModel: { pageSize: 10 } },
          }}
          pageSizeOptions={[10, 25, 50]}
          disableRowSelectionOnClick
          density="compact"
        />
      </Box>

      {/* Delete Dialog */}
      <Dialog open={deleteItemId !== null} onClose={() => setDeleteItemId(null)}>
        <DialogTitle>Confirm Delete</DialogTitle>
        <DialogContent>
          <Typography>
            Are you sure you want to delete this item? If it is equipped, it will be unequipped automatically.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteItemId(null)}>Cancel</Button>
          <Button onClick={handleDeleteConfirm} color="error" variant="contained">Delete</Button>
        </DialogActions>
      </Dialog>

      {/* Edit Dialog */}
      <Dialog open={!!editItem} onClose={() => setEditItem(null)}>
        <form onSubmit={handleEditSave}>
          <DialogTitle>Edit Item: {editItem?.shortName}</DialogTitle>
          <DialogContent dividers>
            <Stack spacing={3} sx={{ mt: 1 }}>
              <Stack direction="row" spacing={2}>
                <TextField
                  name="hits1"
                  label="Condition (hits1)"
                  type="number"
                  defaultValue={editItem?.hits1}
                  required
                  fullWidth
                />
                <TextField
                  name="hits2"
                  label="Max Condition (hits2)"
                  type="number"
                  defaultValue={editItem?.hits2}
                  required
                  fullWidth
                />
              </Stack>
              <TextField
                name="stackCount"
                label="Quantity"
                type="number"
                defaultValue={editItem?.stackCount}
                required
                fullWidth
              />
              <TextField
                name="value1"
                label="Value (Gold)"
                type="number"
                defaultValue={editItem?.value1}
                required
                fullWidth
              />
              <TextField
                name="weightInKg"
                label="Weight (kg)"
                type="number"
                slotProps={{ htmlInput: { step: "0.01" } }}
                defaultValue={editItem?.weightInKg}
                required
                fullWidth
              />
            </Stack>
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setEditItem(null)}>Cancel</Button>
            <Button type="submit" variant="contained">Save</Button>
          </DialogActions>
        </form>
      </Dialog>
    </Paper>
  );
};
