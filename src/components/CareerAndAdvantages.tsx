import React from 'react';
import { 
  Card, 
  CardContent, 
  Typography, 
  Grid, 
  TextField,
  FormControlLabel,
  Checkbox,
  Select,
  MenuItem,
  InputLabel,
  FormControl,
  FormGroup,
  type SelectChangeEvent
} from '@mui/material';
import { useSaveStore, type DFCareer } from '../store/useSaveStore';

export const CareerAndAdvantages: React.FC = () => {
  const saveData = useSaveStore((state) => state.saveData);
  const updateCareerField = useSaveStore((state) => state.updateCareerField);

  if (!saveData?.playerData?.playerEntity?.careerTemplate) {
    return null;
  }

  const career = saveData.playerData.playerEntity.careerTemplate;

  const handleNumberChange = (field: keyof DFCareer) => (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = parseFloat(e.target.value);
    if (!isNaN(val)) {
      updateCareerField(field, val);
    }
  };

  const handleBooleanChange = (field: keyof DFCareer) => (e: React.ChangeEvent<HTMLInputElement>) => {
    updateCareerField(field, e.target.checked);
  };

  const handleSelectChange = (field: keyof DFCareer) => (e: SelectChangeEvent) => {
    updateCareerField(field, e.target.value as string);
  };

  const handleStringFlagChange = (field: keyof DFCareer, flagStr: string) => (e: React.ChangeEvent<HTMLInputElement>) => {
    const currentValue = (career[field] as string) || '';
    const flags = currentValue ? currentValue.split(',').map(s => s.trim()).filter(s => s !== 'None' && s !== '') : [];
    
    if (e.target.checked) {
      if (!flags.includes(flagStr)) {
        flags.push(flagStr);
      }
    } else {
      const index = flags.indexOf(flagStr);
      if (index > -1) {
        flags.splice(index, 1);
      }
    }
    
    updateCareerField(field, flags.join(', '));
  };

  const hasStringFlag = (fieldValue: string | undefined, flagStr: string) => {
    if (!fieldValue) return false;
    const flags = fieldValue.split(',').map(s => s.trim());
    return flags.includes(flagStr);
  };

  return (
    <Card sx={{ mb: 3 }}>
      <CardContent>
        <Typography variant="h6" gutterBottom>
          Career & Advantages
        </Typography>
        <Grid container spacing={3}>
          
          {/* Multipliers & Hit Points */}
          <Grid size={{ xs: 12, sm: 6 }}>
            <TextField
              fullWidth
              label="Skill Advancement Multiplier"
              type="number"
              slotProps={{ htmlInput: { step: 0.01 } }}
              value={career.AdvancementMultiplier || 1.0}
              onChange={handleNumberChange('AdvancementMultiplier')}
            />
          </Grid>
          <Grid size={{ xs: 12, sm: 6 }}>
            <TextField
              fullWidth
              label="Hit Points Per Level"
              type="number"
              value={career.HitPointsPerLevel || 0}
              onChange={handleNumberChange('HitPointsPerLevel')}
            />
          </Grid>

          {/* Booleans (Advantages/Disadvantages) */}
          <Grid size={12}>
            <Typography variant="subtitle1" gutterBottom sx={{ mt: 2 }}>Special Abilities</Typography>
            <FormGroup row>
              <FormControlLabel control={<Checkbox checked={career.AcuteHearing || false} onChange={handleBooleanChange('AcuteHearing')} />} label="Acute Hearing" />
              <FormControlLabel control={<Checkbox checked={career.Athleticism || false} onChange={handleBooleanChange('Athleticism')} />} label="Athleticism" />
              <FormControlLabel control={<Checkbox checked={career.AdrenalineRush || false} onChange={handleBooleanChange('AdrenalineRush')} />} label="Adrenaline Rush" />
              <FormControlLabel control={<Checkbox checked={career.NoRegenSpellPoints || false} onChange={handleBooleanChange('NoRegenSpellPoints')} />} label="No Regen Spell Points" />
              <FormControlLabel control={<Checkbox checked={career.DamageFromSunlight || false} onChange={handleBooleanChange('DamageFromSunlight')} />} label="Damage From Sunlight" />
              <FormControlLabel control={<Checkbox checked={career.DamageFromHolyPlaces || false} onChange={handleBooleanChange('DamageFromHolyPlaces')} />} label="Damage From Holy Places" />
            </FormGroup>
          </Grid>

          {/* Enumerations (Tolerances) */}
          <Grid size={12}>
            <Typography variant="subtitle1" gutterBottom sx={{ mt: 2 }}>Tolerances</Typography>
            <Grid container spacing={2}>
              {['Paralysis', 'Magic', 'Poison', 'Fire', 'Frost', 'Shock', 'Disease'].map((tol) => (
                <Grid size={{ xs: 12, sm: 4 }} key={tol}>
                  <FormControl fullWidth size="small">
                    <InputLabel>{tol}</InputLabel>
                    <Select
                      value={(career[tol as keyof DFCareer] as string) || 'Normal'}
                      label={tol}
                      onChange={handleSelectChange(tol as keyof DFCareer)}
                    >
                      <MenuItem value="Normal">Normal</MenuItem>
                      <MenuItem value="Immune">Immune</MenuItem>
                      <MenuItem value="Resistant">Resistant</MenuItem>
                      <MenuItem value="LowTolerance">Low Tolerance</MenuItem>
                      <MenuItem value="CriticalWeakness">Critical Weakness</MenuItem>
                    </Select>
                  </FormControl>
                </Grid>
              ))}
            </Grid>
          </Grid>

          {/* Magic Flags */}
          <Grid size={12}>
            <Typography variant="subtitle1" gutterBottom sx={{ mt: 2 }}>Magic Abilities</Typography>
            <Grid container spacing={2}>
              <Grid size={{ xs: 12, sm: 4 }}>
                <FormControl fullWidth size="small">
                  <InputLabel>Spell Absorption</InputLabel>
                  <Select value={career.SpellAbsorption || 'None'} label="Spell Absorption" onChange={handleSelectChange('SpellAbsorption')}>
                    <MenuItem value="None">None</MenuItem>
                    <MenuItem value="InLight">In Light</MenuItem>
                    <MenuItem value="InDarkness">In Darkness</MenuItem>
                    <MenuItem value="Always">Always</MenuItem>
                  </Select>
                </FormControl>
              </Grid>
              <Grid size={{ xs: 12, sm: 4 }}>
                <FormControl fullWidth size="small">
                  <InputLabel>Regeneration</InputLabel>
                  <Select value={career.Regeneration || 'None'} label="Regeneration" onChange={handleSelectChange('Regeneration')}>
                    <MenuItem value="None">None</MenuItem>
                    <MenuItem value="InLight">In Light</MenuItem>
                    <MenuItem value="InDarkness">In Darkness</MenuItem>
                    <MenuItem value="InWater">In Water</MenuItem>
                    <MenuItem value="Always">Always</MenuItem>
                  </Select>
                </FormControl>
              </Grid>
              <Grid size={{ xs: 12, sm: 4 }}>
                <FormControl fullWidth size="small">
                  <InputLabel>Rapid Healing</InputLabel>
                  <Select value={career.RapidHealing || 'None'} label="Rapid Healing" onChange={handleSelectChange('RapidHealing')}>
                    <MenuItem value="None">None</MenuItem>
                    <MenuItem value="InLight">In Light</MenuItem>
                    <MenuItem value="InDarkness">In Darkness</MenuItem>
                    <MenuItem value="Always">Always</MenuItem>
                  </Select>
                </FormControl>
              </Grid>
            </Grid>
          </Grid>

          {/* Forbidden Materials (Bitwise Checkboxes) */}
          <Grid size={12}>
            <Typography variant="subtitle1" gutterBottom sx={{ mt: 2 }}>Forbidden Materials</Typography>
            <FormGroup row>
              {[
                { label: 'Iron', val: 'Iron' },
                { label: 'Steel', val: 'Steel' },
                { label: 'Silver', val: 'Silver' },
                { label: 'Elven', val: 'Elven' },
                { label: 'Dwarven', val: 'Dwarven' },
                { label: 'Mithril', val: 'Mithril' },
                { label: 'Adamantium', val: 'Adamantium' },
                { label: 'Ebony', val: 'Ebony' },
                { label: 'Orcish', val: 'Orcish' },
                { label: 'Daedric', val: 'Daedric' }
              ].map(mat => (
                <FormControlLabel 
                  key={mat.label}
                  control={<Checkbox checked={hasStringFlag(career.ForbiddenMaterials, mat.val)} onChange={handleStringFlagChange('ForbiddenMaterials', mat.val)} />} 
                  label={mat.label} 
                />
              ))}
            </FormGroup>
          </Grid>

          {/* Forbidden Shields & Armors */}
          <Grid size={12}>
            <Grid container spacing={3}>
              <Grid size={{ xs: 12, sm: 6 }}>
                <Typography variant="subtitle1" gutterBottom>Forbidden Shields</Typography>
                <FormGroup row>
                  {[
                    { label: 'Buckler', val: 'Buckler' },
                    { label: 'Round Shield', val: 'RoundShield' },
                    { label: 'Kite Shield', val: 'KiteShield' },
                    { label: 'Tower Shield', val: 'TowerShield' },
                  ].map(sh => (
                    <FormControlLabel 
                      key={sh.label}
                      control={<Checkbox checked={hasStringFlag(career.ForbiddenShields, sh.val)} onChange={handleStringFlagChange('ForbiddenShields', sh.val)} />} 
                      label={sh.label} 
                    />
                  ))}
                </FormGroup>
              </Grid>
              <Grid size={{ xs: 12, sm: 6 }}>
                <Typography variant="subtitle1" gutterBottom>Forbidden Armors</Typography>
                <FormGroup row>
                  {[
                    { label: 'Leather', val: 'Leather' },
                    { label: 'Chain', val: 'Chain' },
                    { label: 'Plate', val: 'Plate' },
                  ].map(ar => (
                    <FormControlLabel 
                      key={ar.label}
                      control={<Checkbox checked={hasStringFlag(career.ForbiddenArmors, ar.val)} onChange={handleStringFlagChange('ForbiddenArmors', ar.val)} />} 
                      label={ar.label} 
                    />
                  ))}
                </FormGroup>
              </Grid>
            </Grid>
          </Grid>

        </Grid>
      </CardContent>
    </Card>
  );
};
