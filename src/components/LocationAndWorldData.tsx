import { 
  Box, Typography, Paper, TextField, Select, MenuItem, FormControl, InputLabel, Switch, FormControlLabel, Button, Divider, Stack, Grid 
} from '@mui/material';
import WarningAmberIcon from '@mui/icons-material/WarningAmber';
import AccessTimeIcon from '@mui/icons-material/AccessTime';
import { useSaveStore } from '../store/useSaveStore';

// DaggerfallWorkshop.WeatherType
const WEATHER_OPTIONS = [
  { value: 0, label: 'Sunny' },
  { value: 1, label: 'Cloudy' },
  { value: 2, label: 'Overcast' },
  { value: 3, label: 'Fog' },
  { value: 4, label: 'Rain' },
  { value: 5, label: 'Thunder' },
  { value: 6, label: 'Snow' }
];

// DaggerfallWorkshop.Game.WorldContext
const WORLD_CONTEXT_OPTIONS = [
  { value: 0, label: 'Nothing / Null' },
  { value: 1, label: 'Exterior' },
  { value: 2, label: 'Interior' },
  { value: 3, label: 'Dungeon' }
];

const resolveEnum = (val: any, options: { value: number, label: string }[], fallback: number) => {
  if (typeof val === 'string') {
    // Attempt to match the label
    const opt = options.find(o => o.label.toLowerCase() === val.toLowerCase() || o.label.split(' / ')[0].toLowerCase() === val.toLowerCase());
    if (opt) return opt.value;
  }
  return typeof val === 'number' ? val : fallback;
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

  const handleTimeAdvance = (hours: number) => {
    updateGameTime(hours * 720);
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
              onChange={(e) => updatePlayerPositionCoords({ x: parseFloat(e.target.value) })}
              slotProps={{ htmlInput: { step: "0.01" } }}
            />
            <TextField
              label="Y Coordinate"
              type="number"
              size="small"
              fullWidth
              value={playerPosition.position?.y ?? 0}
              onChange={(e) => updatePlayerPositionCoords({ y: parseFloat(e.target.value) })}
              slotProps={{ htmlInput: { step: "0.01" } }}
            />
            <TextField
              label="Z Coordinate"
              type="number"
              size="small"
              fullWidth
              value={playerPosition.position?.z ?? 0}
              onChange={(e) => updatePlayerPositionCoords({ z: parseFloat(e.target.value) })}
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
              onChange={(e) => updatePlayerPosition({ yaw: parseFloat(e.target.value) })}
              slotProps={{ htmlInput: { step: "0.01" } }}
            />
            <TextField
              label="Pitch"
              type="number"
              size="small"
              fullWidth
              value={playerPosition.pitch ?? 0}
              onChange={(e) => updatePlayerPosition({ pitch: parseFloat(e.target.value) })}
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
              onChange={(e) => updatePlayerPosition({ worldPosX: parseInt(e.target.value) })}
            />
            <TextField
              label="World Pos Z"
              type="number"
              size="small"
              fullWidth
              value={playerPosition.worldPosZ ?? 0}
              onChange={(e) => updatePlayerPosition({ worldPosZ: parseInt(e.target.value) })}
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
                value={resolveEnum(playerPosition.weather, WEATHER_OPTIONS, 0)}
                label="Weather"
                onChange={(e) => updatePlayerPosition({ weather: Number(e.target.value) })}
              >
                {WEATHER_OPTIONS.map(w => (
                  <MenuItem key={w.value} value={w.value}>{w.label}</MenuItem>
                ))}
              </Select>
            </FormControl>
            
            <FormControl fullWidth size="small">
              <InputLabel id="world-context-label">World Context</InputLabel>
              <Select
                labelId="world-context-label"
                value={resolveEnum(playerPosition.worldContext, WORLD_CONTEXT_OPTIONS, 1)}
                label="World Context"
                onChange={(e) => updatePlayerPosition({ worldContext: Number(e.target.value) })}
              >
                {WORLD_CONTEXT_OPTIONS.map(c => (
                  <MenuItem key={c.value} value={c.value}>{c.label}</MenuItem>
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
              <TextField
                label="Building Type"
                size="small"
                fullWidth
                value={playerPosition.buildingDiscoveryData?.buildingType ?? 0}
                onChange={(e) => {
                  const val = e.target.value;
                  updateBuildingDiscoveryData({ buildingType: isNaN(Number(val)) ? val : Number(val) });
                }}
              />
              <TextField
                label="Quality"
                size="small"
                fullWidth
                value={playerPosition.buildingDiscoveryData?.quality ?? 0}
                onChange={(e) => {
                  const val = e.target.value;
                  updateBuildingDiscoveryData({ quality: isNaN(Number(val)) ? val : Number(val) });
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
            <Typography variant="body1">
              Raw Game Time: <strong>{dateAndTime.gameTime}</strong> ticks
            </Typography>
          </Box>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
            Use the helpers below to easily shift in-game time without recalculating ticks. (1 hr = 720 ticks)
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

