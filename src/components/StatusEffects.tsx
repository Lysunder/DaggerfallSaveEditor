import { useMemo } from 'react';
import {
  Box, Button, Chip, Divider, LinearProgress, List, ListItem, ListItemText, Paper, Stack, Tooltip, Typography,
} from '@mui/material';
import HealingIcon from '@mui/icons-material/Healing';
import { useSaveStore, type CureResult } from '../store/useSaveStore';
import { useNotification } from '../context/NotificationContext';
import { findAfflictions, maxVitals, otherEffectCount, type Affliction, type AfflictionKind } from '../data/statusEffects';

const GROUPS: { kind: Exclude<AfflictionKind, 'Curse'>; title: string; cureAll: string; empty: string }[] = [
  { kind: 'Disease', title: 'Diseases', cureAll: 'Cure all diseases', empty: 'No diseases.' },
  { kind: 'Poison', title: 'Poisons', cureAll: 'Cure all poisons', empty: 'No poisons.' },
  { kind: 'HarmfulSpell', title: 'Harmful spells', cureAll: 'Remove all harmful spells', empty: 'No harmful spells.' },
];

const VITALS = [
  { vital: 'health', label: 'Health', field: 'currentHealth', scale: 1 },
  { vital: 'magicka', label: 'Magicka', field: 'currentMagicka', scale: 1 },
  // DFU stores fatigue 64 times larger than the game shows it.
  { vital: 'fatigue', label: 'Fatigue', field: 'currentFatigue', scale: 64 },
] as const;

const formatDamage = (damage: Record<string, number>) =>
  Object.entries(damage).map(([stat, amount]) => `${stat} ${amount > 0 ? '+' : '−'}${Math.abs(amount)}`).join(', ');

export const StatusEffects = () => {
  const playerEntity = useSaveStore((state) => state.saveData?.playerData?.playerEntity);
  const cureAfflictions = useSaveStore((state) => state.cureAfflictions);
  const cureAllOfKind = useSaveStore((state) => state.cureAllOfKind);
  const restoreVital = useSaveStore((state) => state.restoreVital);
  const { showNotification } = useNotification();

  const afflictions = useMemo(() => findAfflictions(playerEntity), [playerEntity]);
  const maxima = useMemo(() => maxVitals(playerEntity), [playerEntity]);
  const others = useMemo(() => otherEffectCount(playerEntity), [playerEntity]);

  if (!playerEntity) return null;

  const report = (result: CureResult) => {
    if (result.cured.length > 0) showNotification(`Cured: ${result.cured.join(', ')}.`, 'success');
    for (const { name, reason } of result.skipped) showNotification(`${name} wasn't removed: ${reason}`, 'warning');
  };

  const curses = afflictions.filter((affliction) => affliction.kind === 'Curse');

  const row = (affliction: Affliction) => (
    <ListItem
      key={affliction.index}
      divider
      secondaryAction={
        affliction.notCurable ? (
          <Tooltip title={affliction.notCurable}>
            <span><Button size="small" disabled>Cure</Button></span>
          </Tooltip>
        ) : (
          <Button size="small" variant="outlined" onClick={() => report(cureAfflictions([affliction.index]))}>Cure</Button>
        )
      }
    >
      <ListItemText
        primary={affliction.name}
        secondary={
          <>
            {affliction.state}
            {Object.keys(affliction.statDamage).length > 0 && ` · ${formatDamage(affliction.statDamage)}`}
            {affliction.notCurable && ` · ${affliction.notCurable}`}
          </>
        }
      />
    </ListItem>
  );

  return (
    <Paper sx={{ p: 3, borderRadius: 2, display: 'flex', flexDirection: 'column', gap: 2 }}>
      <Typography variant="h5" color="success.light">Status Effects</Typography>
      <Typography variant="body2" color="text.secondary">
        Curing removes the disease, poison or spell the same way a temple or a cure potion does, along with the
        attribute damage it was causing. It doesn't give back health already lost; use Restore for that.
      </Typography>

      <Box>
        <Typography variant="h6" gutterBottom color="text.secondary">Vitals</Typography>
        <Stack spacing={1.5}>
          {VITALS.map(({ vital, label, field, scale }) => {
            const current = typeof playerEntity[field] === 'number' ? playerEntity[field] : 0;
            const max = maxima[vital];
            const full = current >= max;
            return (
              <Stack key={vital} direction="row" spacing={2} sx={{ alignItems: 'center' }}>
                <Typography sx={{ width: 80 }}>{label}</Typography>
                <LinearProgress
                  variant="determinate"
                  value={max > 0 ? Math.min(100, (current / max) * 100) : 0}
                  sx={{ flexGrow: 1, height: 8, borderRadius: 4 }}
                />
                <Typography variant="body2" sx={{ width: 110, textAlign: 'right' }}>
                  {Math.floor(current / scale)} / {Math.floor(max / scale)}
                </Typography>
                <Button size="small" variant="outlined" disabled={full} onClick={() => restoreVital(vital)} sx={{ width: 170 }}>
                  Restore {label.toLowerCase()}
                </Button>
              </Stack>
            );
          })}
        </Stack>
      </Box>

      {GROUPS.map(({ kind, title, cureAll, empty }) => {
        const items = afflictions.filter((affliction) => affliction.kind === kind);
        const curable = items.filter((affliction) => !affliction.notCurable);
        return (
          <Box key={kind}>
            <Divider sx={{ mb: 2 }} />
            <Stack direction="row" sx={{ justifyContent: 'space-between', alignItems: 'center' }}>
              <Typography variant="h6" color="text.secondary">
                {title} {items.length > 0 && <Chip size="small" label={items.length} color="warning" sx={{ ml: 1 }} />}
              </Typography>
              <Button
                size="small"
                startIcon={<HealingIcon />}
                disabled={curable.length === 0}
                onClick={() => report(cureAllOfKind(kind))}
              >
                {cureAll}
              </Button>
            </Stack>
            {items.length > 0 ? (
              <List dense disablePadding>{items.map(row)}</List>
            ) : (
              <Typography variant="body2" color="text.disabled" sx={{ fontStyle: 'italic', mt: 1 }}>{empty}</Typography>
            )}
          </Box>
        );
      })}

      {curses.length > 0 && (
        <Box>
          <Divider sx={{ mb: 2 }} />
          <Typography variant="h6" color="text.secondary">Curses</Typography>
          <List dense disablePadding>
            {curses.map((curse) => (
              <ListItem key={curse.index} divider>
                <ListItemText primary={curse.name} secondary="The editor can't cure vampirism or lycanthropy yet." />
              </ListItem>
            ))}
          </List>
        </Box>
      )}

      {others > 0 && (
        <Typography variant="body2" color="text.secondary">
          {others} other active {others === 1 ? 'effect' : 'effects'} (helpful spells, potions or magic items) left as they are.
        </Typography>
      )}
    </Paper>
  );
};
