import React from 'react';
import { 
  Paper, 
  Typography, 
  Grid, 
  Slider, 
  Stack, 
  Box, 
  Divider, 
  TextField 
} from '@mui/material';
import { useSaveStore } from '../store/useSaveStore';

export const StatsAndSkills: React.FC = () => {
  const saveData = useSaveStore((state) => state.saveData);
  const updateStat = useSaveStore((state) => state.updateStat);
  const updateSkill = useSaveStore((state) => state.updateSkill);

  if (!saveData?.playerData?.playerEntity) {
    return null;
  }

  const { stats, skills } = saveData.playerData.playerEntity;
  const safeStats = stats || {};
  const safeSkills = skills || {};

  const statsList = Object.entries(safeStats) as [string, number][];
  const skillsList = Object.entries(safeSkills) as [string, number][];

  const handleStatSliderChange = (statName: string) => (_: Event, newValue: number | number[]) => {
    updateStat(statName as any, newValue as number);
  };

  const handleStatInputChange = (statName: string) => (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = parseInt(e.target.value, 10);
    if (!isNaN(val)) {
      // Constrain between 1 and 100
      const clamped = Math.max(1, Math.min(100, val));
      updateStat(statName as any, clamped);
    }
  };

  const handleSkillChange = (skillName: string) => (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = parseInt(e.target.value, 10);
    if (!isNaN(val)) {
      updateSkill(skillName, val);
    }
  };

  return (
    <>
      {/* Attributes/Stats */}
      <Grid size={{ xs: 12, md: 6 }}>
        <Paper sx={{ p: 3, height: '100%', borderRadius: 2, backgroundImage: 'linear-gradient(rgba(144, 202, 249, 0.05), rgba(255, 255, 255, 0))' }}>
          <Typography variant="h6" gutterBottom color="primary.main">
            Attributes
          </Typography>
          <Divider sx={{ mb: 3 }} />
          <Stack spacing={3}>
            {statsList.map(([statName, value]) => (
              <Box key={statName}>
                <Typography id={`slider-${statName}`} gutterBottom variant="body2" sx={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span>{statName.replace(/([A-Z])/g, ' $1').trim()}</span>
                </Typography>
                <Grid container spacing={2} sx={{ alignItems: 'center' }}>
                  <Grid size="grow">
                    <Slider
                      value={typeof value === 'number' ? value : 0}
                      onChange={handleStatSliderChange(statName)}
                      aria-labelledby={`slider-${statName}`}
                      step={1}
                      min={1}
                      max={100}
                      sx={{ color: 'primary.main' }}
                    />
                  </Grid>
                  <Grid>
                    <TextField
                      value={value}
                      size="small"
                      onChange={handleStatInputChange(statName)}
                      slotProps={{
                        htmlInput: {
                          step: 1,
                          min: 1,
                          max: 100,
                          type: 'number',
                          'aria-labelledby': `slider-${statName}`,
                        }
                      }}
                      sx={{ width: 70 }}
                    />
                  </Grid>
                </Grid>
              </Box>
            ))}
          </Stack>
        </Paper>
      </Grid>

      {/* Skills */}
      <Grid size={{ xs: 12, md: 6 }}>
        <Paper sx={{ p: 3, height: '100%', borderRadius: 2, backgroundImage: 'linear-gradient(rgba(244, 143, 177, 0.05), rgba(255, 255, 255, 0))' }}>
          <Typography variant="h6" gutterBottom color="secondary.main">
            Skills
          </Typography>
          <Divider sx={{ mb: 3 }} />
          <Grid container spacing={1}>
            {skillsList.map(([skillName, value]) => (
              <Grid size={{ xs: 6, sm: 4, md: 3 }} key={skillName}>
                <TextField
                  fullWidth
                  label={skillName.replace(/([A-Z])/g, ' $1').trim()}
                  type="number"
                  size="small"
                  value={value || 0}
                  onChange={handleSkillChange(skillName)}
                  slotProps={{ 
                    inputLabel: { shrink: true },
                    htmlInput: { style: { padding: '6px 8px' } } 
                  }}
                  color="secondary"
                />
              </Grid>
            ))}
          </Grid>
        </Paper>
      </Grid>
    </>
  );
};
