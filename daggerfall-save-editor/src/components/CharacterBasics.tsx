import React from 'react';
import { 
  Card, 
  CardContent, 
  Typography, 
  Grid, 
  TextField 
} from '@mui/material';
import { useSaveStore } from '../store/useSaveStore';

export const CharacterBasics: React.FC = () => {
  const saveData = useSaveStore((state) => state.saveData);
  const updatePlayerField = useSaveStore((state) => state.updatePlayerField);

  if (!saveData?.playerData?.playerEntity) {
    return null;
  }

  const playerEntity = saveData.playerData.playerEntity;

  const handleNumberChange = (field: string) => (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = parseInt(e.target.value, 10);
    if (!isNaN(val)) {
      updatePlayerField(field, val);
    }
  };

  const handleStringChange = (field: string) => (e: React.ChangeEvent<HTMLInputElement>) => {
    updatePlayerField(field, e.target.value);
  };

  return (
    <Card sx={{ mb: 3 }}>
      <CardContent>
        <Typography variant="h6" gutterBottom>
          Character Basics
        </Typography>
        <Grid container spacing={3}>
          <Grid size={{ xs: 12, sm: 6 }}>
            <TextField
              fullWidth
              label="Name"
              value={playerEntity.name || ''}
              onChange={handleStringChange('name')}
            />
          </Grid>
          <Grid size={{ xs: 12, sm: 6 }}>
            <TextField
              fullWidth
              label="Level"
              type="number"
              value={playerEntity.level || 0}
              onChange={handleNumberChange('level')}
            />
          </Grid>
          <Grid size={{ xs: 12, sm: 6 }}>
            <TextField
              fullWidth
              label="Current Health"
              type="number"
              value={playerEntity.currentHealth || 0}
              onChange={handleNumberChange('currentHealth')}
            />
          </Grid>
          <Grid size={{ xs: 12, sm: 6 }}>
            <TextField
              fullWidth
              label="Max Health"
              type="number"
              value={playerEntity.maxHealth || 0}
              onChange={handleNumberChange('maxHealth')}
            />
          </Grid>
          <Grid size={{ xs: 12, sm: 6 }}>
            <TextField
              fullWidth
              label="Current Magicka"
              type="number"
              value={playerEntity.currentMagicka || 0}
              onChange={handleNumberChange('currentMagicka')}
            />
          </Grid>
          <Grid size={{ xs: 12, sm: 6 }}>
            <TextField
              fullWidth
              label="Current Fatigue"
              type="number"
              value={playerEntity.currentFatigue || 0}
              onChange={handleNumberChange('currentFatigue')}
            />
          </Grid>
          <Grid size={{ xs: 12, sm: 6 }}>
            <TextField
              fullWidth
              label="Gold on hand"
              type="number"
              value={playerEntity.goldPieces || 0}
              onChange={handleNumberChange('goldPieces')}
            />
          </Grid>
          <Grid size={{ xs: 12, sm: 6 }}>
            <TextField
              fullWidth
              disabled
              label="Race"
              value={playerEntity.raceTemplate?.Name || ''}
            />
          </Grid>
          <Grid size={{ xs: 12, sm: 6 }}>
            <TextField
              fullWidth
              disabled
              label="Class"
              value={playerEntity.careerTemplate?.Name || ''}
            />
          </Grid>
        </Grid>
      </CardContent>
    </Card>
  );
};
