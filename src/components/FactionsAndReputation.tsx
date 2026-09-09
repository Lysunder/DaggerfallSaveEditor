import React from 'react';
import { 
  Box, Typography, Paper, Grid, Slider, List, ListItem, ListItemText, Select, MenuItem, FormControl, InputLabel, Alert, Divider 
} from '@mui/material';
import { useSaveStore } from '../store/useSaveStore';

const FACTION_NAMES: Record<number, string> = {
  26: 'Temple of Akatosh',
  27: 'Order of Arkay',
  28: 'House of Dibella',
  29: 'School of Julianos',
  30: 'Temple of Kynareth',
  31: 'Benevolence of Mara',
  32: 'Temple of Stendarr',
  33: 'Resolution of Zenithar',
  40: 'Mages Guild',
  41: 'Fighters Guild',
  70: 'Dark Brotherhood',
  84: 'Thieves Guild',
  103: 'Thieves Guild (Alternate)',
  85: 'Knights of the Dragon',
  86: 'Host of the Horn',
  87: 'Knights of the Rose',
  88: 'Knights of the Wheel',
  89: 'Order of the Raven',
  90: 'Knights of the Scarab',
  91: 'Order of the Candle',
  92: 'Knights of the Hawk',
};

const SOCIAL_GROUPS = [
  { key: 'reputationCommoners', label: 'Commoners' },
  { key: 'reputationMerchants', label: 'Merchants' },
  { key: 'reputationNobility', label: 'Nobility' },
  { key: 'reputationScholars', label: 'Scholars' },
  { key: 'reputationUnderworld', label: 'Underworld' },
  { key: 'reputationSupernaturalBeings', label: 'Supernatural Beings' },
  { key: 'reputationGuildMembers', label: 'Guild Members' },
];

const resolveFactionId = (guildGroup: number, variant: number): number => {
  if (guildGroup === 9) return variant; // KnightlyOrder
  if (guildGroup === 17) return variant; // HolyOrder
  
  // Basic GuildGroups -> FactionID mapping based on Daggerfall Unity source
  switch (guildGroup) {
    case 3: return 108; // Dark Brotherhood
    case 4: return 42; // Thieves Guild
    case 10: return 40; // Mages Guild
    case 11: return 41; // Fighters Guild
  }
  
  return variant || guildGroup;
};

export const FactionsAndReputation = () => {
  const saveData = useSaveStore((state) => state.saveData);
  const factionData = useSaveStore((state) => state.factionData);
  const updatePlayerField = useSaveStore((state) => state.updatePlayerField);
  const updateGuildRank = useSaveStore((state) => state.updateGuildRank);

  if (!saveData || !saveData.playerData?.playerEntity) {
    return null;
  }

  const { playerEntity } = saveData.playerData;
  const memberships = saveData.playerData.guildMemberships || [];
  const vampireMemberships = saveData.playerData.vampireMemberships || [];

  const handleReputationChange = (key: string, value: number | number[]) => {
    updatePlayerField(key as any, value as number);
  };

  const dynamicFactions = React.useMemo(() => {
    const dict: Record<number, string> = {};
    if (factionData?.factionDict && Array.isArray(factionData.factionDict)) {
      factionData.factionDict.forEach((item: any) => {
        if (item.Key !== undefined && item.Value?.name) {
          dict[item.Key] = item.Value.name;
        }
      });
    }
    return dict;
  }, [factionData]);

  return (
    <Paper sx={{ p: 3, borderRadius: 2, display: 'flex', flexDirection: 'column', backgroundImage: 'linear-gradient(rgba(103, 58, 183, 0.05), rgba(255, 255, 255, 0))' }}>
      <Typography variant="h5" color="primary.light" gutterBottom>
        Factions & Reputation
      </Typography>
      
      {vampireMemberships.length > 0 && (
        <Alert severity="warning" sx={{ mb: 3 }}>
          <strong>Vampire / Werewolf Affiliation Detected:</strong> You are currently affiliated with a supernatural clan.
        </Alert>
      )}

      <Grid container spacing={4}>
        {/* Social Reputation */}
        <Grid size={{ xs: 12, md: 6 }}>
          <Typography variant="h6" gutterBottom color="text.secondary">
            Social Reputation
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
            Values range from -100 (Hated) to +100 (Revered).
          </Typography>
          
          <Box sx={{ pr: 2 }}>
            {SOCIAL_GROUPS.map(({ key, label }) => {
              const value = (playerEntity as any)[key] ?? 0;
              return (
                <Box key={key} sx={{ mb: 2 }}>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
                    <Typography variant="body2">{label}</Typography>
                    <Typography variant="body2" sx={{ fontWeight: 'bold' }} color={value < 0 ? 'error.main' : value > 0 ? 'success.main' : 'text.secondary'}>
                      {value > 0 ? `+${value}` : value}
                    </Typography>
                  </Box>
                  <Slider
                    value={value}
                    min={-100}
                    max={100}
                    step={1}
                    onChange={(_, val) => handleReputationChange(key, val)}
                    valueLabelDisplay="auto"
                    color={value < 0 ? 'error' : value > 0 ? 'success' : 'primary'}
                    size="small"
                  />
                </Box>
              );
            })}
          </Box>
        </Grid>

        {/* Guild Memberships */}
        <Grid size={{ xs: 12, md: 6 }}>
          <Typography variant="h6" gutterBottom color="text.secondary">
            Guild Memberships
          </Typography>
          
          {memberships.length === 0 ? (
            <Typography variant="body2" color="text.disabled" sx={{ fontStyle: 'italic', mt: 2 }}>
              No active guild memberships found.
            </Typography>
          ) : (
            <List disablePadding>
              {memberships.map((membership: any, index: number) => {
                const guildGroupId = membership.Key;
                const variant = membership.Value?.variant ?? 0;
                const factionId = resolveFactionId(guildGroupId, variant);
                const guildName = dynamicFactions[factionId] || FACTION_NAMES[factionId] || `Unknown Faction (Group: ${guildGroupId}, ID: ${factionId})`;
                const rank = membership.Value?.rank ?? 0;

                return (
                  <React.Fragment key={guildGroupId}>
                    <ListItem sx={{ py: 1.5, px: 0, display: 'flex', justifyContent: 'space-between' }}>
                      <ListItemText 
                        primary={guildName}
                        secondary={`Faction ID: ${factionId}`}
                      />
                      <FormControl size="small" sx={{ minWidth: 140 }}>
                        <InputLabel id={`rank-label-${guildGroupId}`}>Guild Rank</InputLabel>
                        <Select
                          labelId={`rank-label-${guildGroupId}`}
                          value={rank}
                          label="Guild Rank"
                          onChange={(e) => updateGuildRank(guildGroupId, Number(e.target.value))}
                        >
                          {[0, 1, 2, 3, 4, 5, 6, 7, 8, 9].map((r) => (
                            <MenuItem key={r} value={r}>
                              Rank {r}
                            </MenuItem>
                          ))}
                        </Select>
                      </FormControl>
                    </ListItem>
                    {index < memberships.length - 1 && <Divider />}
                  </React.Fragment>
                );
              })}
            </List>
          )}
        </Grid>
      </Grid>
    </Paper>
  );
};
