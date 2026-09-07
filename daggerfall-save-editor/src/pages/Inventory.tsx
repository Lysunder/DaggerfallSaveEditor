import { useState, useMemo } from 'react';
import {
  Box,
  Typography,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TableSortLabel,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  Stack
} from '@mui/material';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import { useSaveStore, type Item } from '../store/useSaveStore';

type Order = 'asc' | 'desc';
type OrderBy = keyof Item;

export default function Inventory() {
  const saveData = useSaveStore((state) => state.saveData);
  const updateItem = useSaveStore((state) => state.updateItem);
  const deleteItem = useSaveStore((state) => state.deleteItem);

  const [order, setOrder] = useState<Order>('asc');
  const [orderBy, setOrderBy] = useState<OrderBy>('shortName');
  const [groupFilter, setGroupFilter] = useState<string>('All');
  
  // Dialog state
  const [editItem, setEditItem] = useState<Item | null>(null);
  const [editHits1, setEditHits1] = useState<number>(0);
  const [editStackCount, setEditStackCount] = useState<number>(0);
  const [editValue1, setEditValue1] = useState<number>(0);

  const [deleteItemConfirm, setDeleteItemConfirm] = useState<Item | null>(null);

  if (!saveData || !saveData.playerData?.playerEntity) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%' }}>
        <Typography variant="h5" color="text.secondary">
          Please open a valid Daggerfall Unity save file to begin.
        </Typography>
      </Box>
    );
  }

  const items = saveData.playerData.playerEntity.items || [];

  const handleRequestSort = (property: OrderBy) => {
    const isAsc = orderBy === property && order === 'asc';
    setOrder(isAsc ? 'desc' : 'asc');
    setOrderBy(property);
  };

  const handleEditClick = (item: Item) => {
    setEditItem(item);
    setEditHits1(item.hits1 || 0);
    setEditStackCount(item.stackCount || 1);
    setEditValue1(item.value1 || 0);
  };

  const handleEditSave = () => {
    if (editItem) {
      updateItem(editItem.uid, {
        hits1: editHits1,
        stackCount: editStackCount,
        value1: editValue1
      });
      setEditItem(null);
    }
  };

  const handleDeleteConfirm = () => {
    if (deleteItemConfirm) {
      deleteItem(deleteItemConfirm.uid);
      setDeleteItemConfirm(null);
    }
  };

  // Extract unique item groups for the filter dropdown
  const itemGroups = useMemo(() => {
    const groups = new Set<string>();
    items.forEach((item) => {
      if (item.itemGroup) groups.add(item.itemGroup);
    });
    return Array.from(groups).sort();
  }, [items]);

  // Filter and sort items
  const visibleItems = useMemo(() => {
    let filtered = [...items];
    
    if (groupFilter !== 'All') {
      filtered = filtered.filter((item) => item.itemGroup === groupFilter);
    }

    filtered.sort((a, b) => {
      const aVal = a[orderBy] !== undefined ? a[orderBy] : '';
      const bVal = b[orderBy] !== undefined ? b[orderBy] : '';
      
      if (aVal < bVal) {
        return order === 'asc' ? -1 : 1;
      }
      if (aVal > bVal) {
        return order === 'asc' ? 1 : -1;
      }
      return 0;
    });

    return filtered;
  }, [items, groupFilter, order, orderBy]);

  return (
    <Box sx={{ pb: 4 }}>
      <Typography variant="h4" gutterBottom sx={{ fontWeight: 'bold' }}>
        Inventory
      </Typography>

      <Paper sx={{ p: 3, borderRadius: 2, mb: 4, backgroundImage: 'linear-gradient(rgba(255, 255, 255, 0.05), rgba(255, 255, 255, 0))' }}>
        <Box sx={{ mb: 3, display: 'flex', alignItems: 'center' }}>
          <FormControl sx={{ minWidth: 200 }}>
            <InputLabel id="item-group-filter-label">Filter by Group</InputLabel>
            <Select
              labelId="item-group-filter-label"
              id="item-group-filter"
              value={groupFilter}
              label="Filter by Group"
              onChange={(e) => setGroupFilter(e.target.value)}
            >
              <MenuItem value="All">All Groups</MenuItem>
              {itemGroups.map((group) => (
                <MenuItem key={group} value={group}>{group}</MenuItem>
              ))}
            </Select>
          </FormControl>
        </Box>

        <TableContainer>
          <Table size="small">
            <TableHead>
              <TableRow>
                <TableCell>
                  <TableSortLabel
                    active={orderBy === 'shortName'}
                    direction={orderBy === 'shortName' ? order : 'asc'}
                    onClick={() => handleRequestSort('shortName')}
                  >
                    Short Name
                  </TableSortLabel>
                </TableCell>
                <TableCell>
                  <TableSortLabel
                    active={orderBy === 'itemGroup'}
                    direction={orderBy === 'itemGroup' ? order : 'asc'}
                    onClick={() => handleRequestSort('itemGroup')}
                  >
                    Group
                  </TableSortLabel>
                </TableCell>
                <TableCell align="right">
                  <TableSortLabel
                    active={orderBy === 'weightInKg'}
                    direction={orderBy === 'weightInKg' ? order : 'asc'}
                    onClick={() => handleRequestSort('weightInKg')}
                  >
                    Weight (kg)
                  </TableSortLabel>
                </TableCell>
                <TableCell align="right">
                  <TableSortLabel
                    active={orderBy === 'value1'}
                    direction={orderBy === 'value1' ? order : 'asc'}
                    onClick={() => handleRequestSort('value1')}
                  >
                    Value
                  </TableSortLabel>
                </TableCell>
                <TableCell align="right">
                  <TableSortLabel
                    active={orderBy === 'hits1'}
                    direction={orderBy === 'hits1' ? order : 'asc'}
                    onClick={() => handleRequestSort('hits1')}
                  >
                    Condition (Hits)
                  </TableSortLabel>
                </TableCell>
                <TableCell align="right">
                  <TableSortLabel
                    active={orderBy === 'stackCount'}
                    direction={orderBy === 'stackCount' ? order : 'asc'}
                    onClick={() => handleRequestSort('stackCount')}
                  >
                    Stack
                  </TableSortLabel>
                </TableCell>
                <TableCell align="center">Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {visibleItems.map((item) => (
                <TableRow key={item.uid} hover>
                  <TableCell>{item.shortName}</TableCell>
                  <TableCell>{item.itemGroup}</TableCell>
                  <TableCell align="right">{item.weightInKg}</TableCell>
                  <TableCell align="right">{item.value1}</TableCell>
                  <TableCell align="right">{item.hits1}</TableCell>
                  <TableCell align="right">{item.stackCount}</TableCell>
                  <TableCell align="center">
                    <IconButton size="small" color="primary" onClick={() => handleEditClick(item)}>
                      <EditIcon fontSize="small" />
                    </IconButton>
                    <IconButton size="small" color="error" onClick={() => setDeleteItemConfirm(item)}>
                      <DeleteIcon fontSize="small" />
                    </IconButton>
                  </TableCell>
                </TableRow>
              ))}
              {visibleItems.length === 0 && (
                <TableRow>
                  <TableCell colSpan={7} align="center" sx={{ py: 3 }}>
                    <Typography color="text.secondary">No items found.</Typography>
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </TableContainer>
      </Paper>

      {/* Edit Dialog */}
      <Dialog open={!!editItem} onClose={() => setEditItem(null)} maxWidth="xs" fullWidth>
        <DialogTitle>Edit Item: {editItem?.shortName}</DialogTitle>
        <DialogContent>
          <Stack spacing={3} sx={{ mt: 1 }}>
            <TextField
              label="Condition (Hits)"
              type="number"
              fullWidth
              value={editHits1}
              onChange={(e) => setEditHits1(parseInt(e.target.value) || 0)}
            />
            <TextField
              label="Stack Count"
              type="number"
              fullWidth
              value={editStackCount}
              onChange={(e) => setEditStackCount(parseInt(e.target.value) || 0)}
            />
            <TextField
              label="Value"
              type="number"
              fullWidth
              value={editValue1}
              onChange={(e) => setEditValue1(parseInt(e.target.value) || 0)}
            />
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setEditItem(null)}>Cancel</Button>
          <Button onClick={handleEditSave} variant="contained" color="primary">Save</Button>
        </DialogActions>
      </Dialog>

      {/* Delete Confirm Dialog */}
      <Dialog open={!!deleteItemConfirm} onClose={() => setDeleteItemConfirm(null)}>
        <DialogTitle>Confirm Deletion</DialogTitle>
        <DialogContent>
          <Typography>
            Are you sure you want to delete <strong>{deleteItemConfirm?.shortName}</strong>? This action cannot be undone.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteItemConfirm(null)}>Cancel</Button>
          <Button onClick={handleDeleteConfirm} color="error" variant="contained">Delete</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
