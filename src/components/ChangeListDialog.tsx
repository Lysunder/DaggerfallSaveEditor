import { useMemo } from 'react';
import {
  Box, Button, Chip, Dialog, DialogActions, DialogContent, DialogTitle, IconButton, List, ListItem, ListItemText,
  ListSubheader, Tooltip, Typography,
} from '@mui/material';
import UndoIcon from '@mui/icons-material/Undo';
import { useSaveStore } from '../store/useSaveStore';
import { useNotification } from '../context/NotificationContext';
import { useConfirm } from '../context/confirm';
import { useUnsavedChanges } from '../hooks/useUnsavedChanges';
import { useSaveWriter } from '../hooks/useSaveWriter';
import { SECTION_ORDER, labelChange, type ChangeLabel } from '../utils/changeLabels';
import { changeId, type Change } from '../utils/saveDiff';

interface Row {
  change: Change;
  label: ChangeLabel;
  repaired: boolean;
}

interface RecordGroup {
  id: string;
  name?: string;
  rows: Row[];
}

const describeValues = (row: Row) => {
  if (row.change.kind === 'removed') return 'Deleted';
  if (row.change.kind === 'added') return 'New';
  return `${row.label.before} → ${row.label.after}`;
};

/** Lists unsaved changes by section, with per-change and per-record revert. */
export const ChangeListDialog = ({ open, onClose }: { open: boolean; onClose: () => void }) => {
  const { changes, repairedIds } = useUnsavedChanges();
  const factionData = useSaveStore((state) => state.factionData);
  const memberships = useSaveStore((state) => state.saveData?.playerData?.guildMemberships);
  const revertChange = useSaveStore((state) => state.revertChange);
  const discardChanges = useSaveStore((state) => state.discardChanges);
  const { save } = useSaveWriter();
  const { showNotification } = useNotification();
  const confirm = useConfirm();

  const factionNames = useMemo(() => {
    const names = new Map<number, string>();
    for (const faction of factionData?.factionDict ?? []) {
      if (faction?.Value?.name) names.set(faction.Key, faction.Value.name);
    }
    return names;
  }, [factionData]);

  const guildVariants = useMemo(
    () => new Map((memberships ?? []).map((membership) => [membership.Key, membership.Value?.variant ?? 0])),
    [memberships],
  );

  const sections = useMemo(() => {
    const bySection = new Map<string, Map<string, RecordGroup>>();
    for (const change of changes) {
      const row: Row = { change, label: labelChange(change, { factionNames, guildVariants }), repaired: repairedIds.has(change.id) };
      // A record's field changes are grouped so they can be reverted together.
      const groupId = change.record && change.kind === 'changed' ? changeId(change.file, change.record.path) : change.id;
      const groups = bySection.get(row.label.section) ?? new Map<string, RecordGroup>();
      const group = groups.get(groupId) ?? { id: groupId, name: change.kind === 'changed' ? change.record?.name : undefined, rows: [] };
      group.rows.push(row);
      groups.set(groupId, group);
      bySection.set(row.label.section, groups);
    }
    return [...bySection.entries()]
      .sort(([a], [b]) => SECTION_ORDER.indexOf(a) - SECTION_ORDER.indexOf(b))
      .map(([section, groups]) => ({ section, groups: [...groups.values()], count: [...groups.values()].reduce((n, g) => n + g.rows.length, 0) }));
  }, [changes, repairedIds, factionNames, guildVariants]);

  const revert = (rows: Row[]) => {
    const occupied: number[] = [];
    for (const row of rows) {
      if (row.repaired) continue;
      occupied.push(...revertChange(row.change).occupiedSlots);
    }
    if (occupied.length > 0) {
      showNotification(
        `Restored the item, but equipment ${occupied.length === 1 ? 'slot' : 'slots'} ${occupied.join(', ')} now ${occupied.length === 1 ? 'holds' : 'hold'} another item, so ${occupied.length === 1 ? 'it was' : 'they were'} left as is.`,
        'info',
      );
    }
  };

  const handleDiscard = async () => {
    const choice = await confirm({
      title: 'Discard all changes?',
      message: `This undoes all ${changes.length} unsaved ${changes.length === 1 ? 'change' : 'changes'}. Repairs made on load are kept.`,
      actions: [
        { value: 'cancel', label: 'Cancel', color: 'inherit' },
        { value: 'discard', label: 'Discard all', color: 'error', variant: 'contained' },
      ],
      cancelValue: 'cancel',
    });
    if (choice === 'discard') {
      discardChanges();
      showNotification('Discarded unsaved changes.', 'info');
    }
  };

  const handleSave = async () => {
    if (await save()) onClose();
  };

  const renderRow = (row: Row, indent = false) => (
    <ListItem
      key={row.change.id}
      sx={{ pl: indent ? 4 : 2 }}
      secondaryAction={
        row.repaired ? (
          <Tooltip title="Fixed on load so Daggerfall Unity can read the save. Reverting would stop it loading.">
            <Chip label="Repaired" size="small" color="warning" variant="outlined" />
          </Tooltip>
        ) : (
          <Tooltip title="Revert this change">
            <IconButton edge="end" size="small" onClick={() => revert([row])}><UndoIcon fontSize="small" /></IconButton>
          </Tooltip>
        )
      }
    >
      <ListItemText primary={row.label.label} secondary={describeValues(row)} />
    </ListItem>
  );

  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="md">
      <DialogTitle>Unsaved changes ({changes.length})</DialogTitle>
      <DialogContent dividers sx={{ p: 0 }}>
        {changes.length === 0 ? (
          <Typography color="text.secondary" sx={{ p: 3, textAlign: 'center' }}>No unsaved changes.</Typography>
        ) : (
          <List disablePadding>
            {sections.map(({ section, groups, count }) => (
              <li key={section}>
                <ul style={{ padding: 0 }}>
                  <ListSubheader sx={{ bgcolor: 'background.paper' }}>{section} · {count}</ListSubheader>
                  {groups.map((group) =>
                    group.rows.length > 1 ? (
                      <Box key={group.id}>
                        <ListItem
                          secondaryAction={
                            group.rows.some((row) => !row.repaired) && (
                              <Button size="small" startIcon={<UndoIcon />} onClick={() => revert(group.rows)}>Revert all</Button>
                            )
                          }
                        >
                          <ListItemText primary={group.name ?? group.rows[0].label.label} slotProps={{ primary: { sx: { fontWeight: 500 } } }} />
                        </ListItem>
                        {group.rows.map((row) => renderRow(row, true))}
                      </Box>
                    ) : (
                      renderRow(group.rows[0])
                    ),
                  )}
                </ul>
              </li>
            ))}
          </List>
        )}
      </DialogContent>
      <DialogActions>
        <Button color="error" onClick={handleDiscard} disabled={changes.length === 0} sx={{ mr: 'auto' }}>Discard all changes</Button>
        <Button onClick={onClose}>Close</Button>
        <Button variant="contained" onClick={handleSave} disabled={changes.length === 0}>Save</Button>
      </DialogActions>
    </Dialog>
  );
};
