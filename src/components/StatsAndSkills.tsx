import React from 'react';
import { 
  Paper, 
  Typography, 
  Grid, 
  Slider, 
  Stack, 
  Box, 
  Divider, 
  TextField,
  LinearProgress,
  Tooltip
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

  const getLevelProgress = () => {
    const player = saveData?.playerData?.playerEntity;
    const career = player?.careerTemplate;
    const startingSum = player?.startingLevelUpSkillSum;

    if (!player || !career || startingSum === undefined) return null;
    
    const safeSkills = player.skills || {};
    
    const getSkillValue = (skillName: string) => safeSkills[skillName as keyof typeof safeSkills] || 0;

    const primarySum = 
      getSkillValue(career.PrimarySkill1) + 
      getSkillValue(career.PrimarySkill2) + 
      getSkillValue(career.PrimarySkill3);

    const majorVals = [
      getSkillValue(career.MajorSkill1),
      getSkillValue(career.MajorSkill2),
      getSkillValue(career.MajorSkill3)
    ].sort((a, b) => b - a);
    const majorSum = majorVals[0] + majorVals[1];

    const minorVals = [
      getSkillValue(career.MinorSkill1),
      getSkillValue(career.MinorSkill2),
      getSkillValue(career.MinorSkill3),
      getSkillValue(career.MinorSkill4),
      getSkillValue(career.MinorSkill5),
      getSkillValue(career.MinorSkill6)
    ].sort((a, b) => b - a);
    const minorSum = minorVals[0];

    const currentSum = primarySum + majorSum + minorSum;
    const skillIncreases = Math.max(0, currentSum - startingSum);
    const currentLevel = Math.floor((skillIncreases + 28) / 15);
    
    const reqForCurrent = currentLevel === 1 ? 0 : (15 * (currentLevel - 1) - 13);
    const reqForNext = 15 * currentLevel - 13;
    
    const progressInLevel = skillIncreases - reqForCurrent;
    const totalForLevel = reqForNext - reqForCurrent;
    const percentage = Math.min(100, Math.max(0, (progressInLevel / totalForLevel) * 100));

    return {
      currentLevel,
      skillIncreases,
      reqForNext,
      progressInLevel,
      totalForLevel,
      percentage
    };
  };

  const progress = getLevelProgress();

  return (
    <>
      {/* Level Progress */}
      {progress && (
        <Grid size={{ xs: 12 }}>
          <Paper sx={{ p: 3, borderRadius: 2, mb: 2 }}>
            <Typography variant="h6" gutterBottom color="text.secondary">
              Level Progress (Current Level: {progress.currentLevel})
            </Typography>
            <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
              <Box sx={{ width: '100%', mr: 2 }}>
                <Tooltip title={`${progress.skillIncreases} total skill increases since start. Need ${progress.reqForNext} for level ${progress.currentLevel + 1}.`}>
                  <LinearProgress variant="determinate" value={progress.percentage} sx={{ height: 10, borderRadius: 5 }} color="primary" />
                </Tooltip>
              </Box>
              <Box sx={{ minWidth: 35 }}>
                <Typography variant="body2" color="text.secondary">
                  {Math.round(progress.percentage)}%
                </Typography>
              </Box>
            </Box>
            <Typography variant="body2" color="text.secondary" sx={{ textAlign: 'center' }}>
              {progress.progressInLevel} / {progress.totalForLevel} skill increases to reach Level {progress.currentLevel + 1}
            </Typography>
          </Paper>
        </Grid>
      )}

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
