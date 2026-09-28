import { 
  Box, Typography, Paper, TextField, Select, MenuItem, FormControl, InputLabel, Switch, FormControlLabel, Button, Divider, Stack, Grid 
} from '@mui/material';
import WarningAmberIcon from '@mui/icons-material/WarningAmber';
import AccessTimeIcon from '@mui/icons-material/AccessTime';
import { useSaveStore } from '../store/useSaveStore';
import { SECONDS_PER_HOUR, formatGameTime } from '../utils/daggerfallDate';
import { BUILDING_TYPES, WEATHER_TYPES, WORLD_CONTEXTS, buildingTypeName, weatherName, worldContextName } from '../data/dfuEnums';

// Selects store DFU's enum member names, which is how the game writes these fields.
const spaced = (name: string) => name.replace(/([a-z])([A-Z0-9])/g, '$1 $2');

// Ignores empty or partial input ("", "-"): NaN would be saved as null, which DFU can't load.
const withNumber = (raw: string, parse: (text: string) => number, apply: (value: number) => void) => {
  const value = parse(raw);
  if (Number.isFinite(value)) apply(value);
};

export const LocationAndWorldData = () => {
  const saveData = useSaveStore((state) => state.saveData);
  const updatePlayerPosition = useSaveStore((state) => state.updatePlayerPosition);
  const updatePlayerPositionCoords = useSaveStore((state) => state.updatePlayerPositionCoords);
  const updateBuildingDiscoveryData = useSaveStore((state) => state.updateBuildingDiscoveryData);
  const updateGameTime = useSaveStore((state) => state.updateGameTime);

  if (!saveData || !saveData.playerData?.playerPosition || !saveData.dateAndTime) {
    return null;
  }

  const { playerPosition } = saveData.playerData;
  const { dateAndTime } = saveData;
  
  const handleUnstuck = () => {
    updatePlayerPositionCoords({ y: (playerPosition.position?.y || 0) + 10.0 });
    updatePlayerPosition({ insideDungeon: false });
  };

  // gameTime is in seconds (DaggerfallDateTime), so an hour is 3600.
  const handleTimeAdvance = (hours: number) => {
    updateGameTime(hours * SECONDS_PER_HOUR);
  };

  return (
    <Paper sx={{ p: 3, borderRadius: 2, display: 'flex', flexDirection: 'column', backgroundImage: 'linear-gradient(rgba(76, 175, 80, 0.05), rgba(255, 255, 255, 0))' }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h5" color="success.light">
          Location & World Data
        </Typography>
        <Button 
          variant="outlined" 
          color="warning" 
          startIcon={<WarningAmberIcon />} 
          onClick={handleUnstuck}
          size="small"
        >
          Unstuck / Safe Teleport (+10 Y)
        </Button>
      </Box>

      <Grid container spacing={4}>
        {/* Coordinates & Orientation */}
        <Grid size={{ xs: 12, md: 6 }}>
          <Typography variant="h6" gutterBottom color="text.secondary">
            Player Position & Orientation
          </Typography>
          <Box sx={{ display: 'flex', gap: 2, mb: 2 }}>
            <TextField
              label="X Coordinate"
              type="number"
              size="small"
              fullWidth
              value={playerPosition.position?.x ?? 0}
              onChange={(e) => withNumber(e.target.value, parseFloat, (x) => updatePlayerPositionCoords({ x }))}
              slotProps={{ htmlInput: { step: "0.01" } }}
            />
            <TextField
              label="Y Coordinate"
              type="number"
              size="small"
              fullWidth
              value={playerPosition.position?.y ?? 0}
              onChange={(e) => withNumber(e.target.value, parseFloat, (y) => updatePlayerPositionCoords({ y }))}
              slotProps={{ htmlInput: { step: "0.01" } }}
            />
            <TextField
              label="Z Coordinate"
              type="number"
              size="small"
              fullWidth
              value={playerPosition.position?.z ?? 0}
              onChange={(e) => withNumber(e.target.value, parseFloat, (z) => updatePlayerPositionCoords({ z }))}
              slotProps={{ htmlInput: { step: "0.01" } }}
            />
          </Box>
          <Box sx={{ display: 'flex', gap: 2, mb: 3 }}>
            <TextField
              label="Yaw"
              type="number"
              size="small"
              fullWidth
              value={playerPosition.yaw ?? 0}
              onChange={(e) => withNumber(e.target.value, parseFloat, (yaw) => updatePlayerPosition({ yaw }))}
              slotProps={{ htmlInput: { step: "0.01" } }}
            />
            <TextField
              label="Pitch"
              type="number"
              size="small"
              fullWidth
              value={playerPosition.pitch ?? 0}
              onChange={(e) => withNumber(e.target.value, parseFloat, (pitch) => updatePlayerPosition({ pitch }))}
              slotProps={{ htmlInput: { step: "0.01" } }}
            />
          </Box>
          
          <Typography variant="subtitle2" gutterBottom color="text.secondary">
            World Cell Map Coordinates
          </Typography>
          <Box sx={{ display: 'flex', gap: 2 }}>
            <TextField
              label="World Pos X"
              type="number"
              size="small"
              fullWidth
              value={playerPosition.worldPosX ?? 0}
              onChange={(e) => withNumber(e.target.value, parseInt, (worldPosX) => updatePlayerPosition({ worldPosX }))}
            />
            <TextField
              label="World Pos Z"
              type="number"
              size="small"
              fullWidth
              value={playerPosition.worldPosZ ?? 0}
              onChange={(e) => withNumber(e.target.value, parseInt, (worldPosZ) => updatePlayerPosition({ worldPosZ }))}
            />
          </Box>
        </Grid>

        {/* Environment & Context */}
        <Grid size={{ xs: 12, md: 6 }}>
          <Typography variant="h6" gutterBottom color="text.secondary">
            Environment & Context
          </Typography>
          
          <Stack direction="row" spacing={2} sx={{ mb: 3 }}>
            <FormControl fullWidth size="small">
              <InputLabel id="weather-select-label">Weather</InputLabel>
              <Select
                labelId="weather-select-label"
                value={weatherName(playerPosition.weather) ?? ''}
                label="Weather"
                onChange={(e) => updatePlayerPosition({ weather: e.target.value })}
              >
                {WEATHER_TYPES.map(w => (
                  <MenuItem key={w.name} value={w.name}>{w.name}</MenuItem>
                ))}
              </Select>
            </FormControl>
            
            <FormControl fullWidth size="small">
              <InputLabel id="world-context-label">World Context</InputLabel>
              <Select
                labelId="world-context-label"
                value={worldContextName(playerPosition.worldContext) ?? ''}
                label="World Context"
                onChange={(e) => updatePlayerPosition({ worldContext: e.target.value })}
              >
                {WORLD_CONTEXTS.map(c => (
                  <MenuItem key={c.name} value={c.name}>{c.name}</MenuItem>
                ))}
              </Select>
            </FormControl>
          </Stack>

          <Typography variant="subtitle2" gutterBottom color="text.secondary">
            Interior State Flags
          </Typography>
          <Grid container spacing={1}>
            <Grid size={{ xs: 6 }}>
              <FormControlLabel
                control={<Switch checked={!!playerPosition.insideDungeon} onChange={(e) => updatePlayerPosition({ insideDungeon: e.target.checked })} />}
                label="Inside Dungeon"
              />
            </Grid>
            <Grid size={{ xs: 6 }}>
              <FormControlLabel
                control={<Switch checked={!!playerPosition.insideBuilding} onChange={(e) => updatePlayerPosition({ insideBuilding: e.target.checked })} />}
                label="Inside Building"
              />
            </Grid>
            <Grid size={{ xs: 6 }}>
              <FormControlLabel
                control={<Switch checked={!!playerPosition.insideTavern} onChange={(e) => updatePlayerPosition({ insideTavern: e.target.checked })} />}
                label="Inside Tavern"
              />
            </Grid>
            <Grid size={{ xs: 6 }}>
              <FormControlLabel
                control={<Switch checked={!!playerPosition.insideResidence} onChange={(e) => updatePlayerPosition({ insideResidence: e.target.checked })} />}
                label="Inside Residence"
              />
            </Grid>
          </Grid>
        </Grid>
      </Grid>
      
      <Divider sx={{ my: 4 }} />

      <Grid container spacing={4}>
        {/* Building Discovery Info */}
        <Grid size={{ xs: 12, md: 6 }}>
          <Typography variant="h6" gutterBottom color="text.secondary">
            Building Discovery Data
          </Typography>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            <TextField
              label="Display Name"
              size="small"
              fullWidth
              value={playerPosition.buildingDiscoveryData?.displayName || ''}
              onChange={(e) => updateBuildingDiscoveryData({ displayName: e.target.value })}
            />
            <Stack direction="row" spacing={2}>
              <FormControl fullWidth size="small">
                <InputLabel id="building-type-label">Building Type</InputLabel>
                <Select
                  labelId="building-type-label"
                  label="Building Type"
                  value={buildingTypeName(playerPosition.buildingDiscoveryData?.buildingType) ?? ''}
                  onChange={(e) => updateBuildingDiscoveryData({ buildingType: e.target.value })}
                >
                  {BUILDING_TYPES.map(b => (
                    <MenuItem key={b.name} value={b.name}>{spaced(b.name)}</MenuItem>
                  ))}
                </Select>
              </FormControl>
              {/* quality is a C# int in DFU; anything else would stop the save loading. */}
              <TextField
                label="Quality"
                size="small"
                fullWidth
                type="number"
                value={playerPosition.buildingDiscoveryData?.quality ?? 0}
                slotProps={{ htmlInput: { step: 1 } }}
                onChange={(e) => {
                  const val = parseInt(e.target.value, 10);
                  if (!isNaN(val)) updateBuildingDiscoveryData({ quality: val });
                }}
              />
            </Stack>
          </Box>
        </Grid>

        {/* Time & Calendar */}
        <Grid size={{ xs: 12, md: 6 }}>
          <Typography variant="h6" gutterBottom color="text.secondary">
            Time & Calendar
          </Typography>
          <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
            <AccessTimeIcon color="action" sx={{ mr: 1 }} />
            <Box>
              <Typography variant="body1">
                <strong>{formatGameTime(dateAndTime.gameTime, true)}</strong>
              </Typography>
              <Typography variant="caption" color="text.secondary">
                Raw game time: {dateAndTime.gameTime} seconds
              </Typography>
            </Box>
          </Box>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
            Use the helpers below to shift in-game time without calculating seconds by hand.
          </Typography>
          
          <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
            <Button variant="outlined" size="small" onClick={() => handleTimeAdvance(-24)}>
              - 1 Day
            </Button>
            <Button variant="outlined" size="small" onClick={() => handleTimeAdvance(-1)}>
              - 1 Hour
            </Button>
            <Button variant="outlined" size="small" onClick={() => handleTimeAdvance(1)}>
              + 1 Hour
            </Button>
            <Button variant="outlined" size="small" onClick={() => handleTimeAdvance(24)}>
              + 1 Day
            </Button>
            <Button variant="outlined" size="small" onClick={() => handleTimeAdvance(24 * 7)}>
              + 1 Week
            </Button>
          </Box>
        </Grid>
      </Grid>
    </Paper>
  );
};

