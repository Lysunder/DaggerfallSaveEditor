import { Typography, Box, Grid } from '@mui/material';
import { useSaveStore } from '../store/useSaveStore';
import { CharacterBasics } from '../components/CharacterBasics';
import { StatsAndSkills } from '../components/StatsAndSkills';
import { InventoryManager } from '../components/InventoryManager';
import { FinancesAndBanking } from '../components/FinancesAndBanking';
import { QuestProgress } from '../components/QuestProgress';

export default function Home() {
  const saveData = useSaveStore((state) => state.saveData);

  if (!saveData || !saveData.playerData?.playerEntity) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%' }}>
        <Typography variant="h5" color="text.secondary">
          Please open a valid Daggerfall Unity save file to begin.
        </Typography>
      </Box>
    );
  }

  const { playerEntity } = saveData.playerData;

  return (
    <Box sx={{ pb: 4 }}>
      <Typography variant="h4" gutterBottom sx={{ fontWeight: 'bold' }}>
        Character Sheet - {playerEntity.name || 'Unknown'} (Level {playerEntity.level || 1})
      </Typography>

      <Grid container spacing={4} sx={{ mt: 2 }}>
        {/* Basic Info */}
        <Grid size={{ xs: 12 }}>
          <CharacterBasics />
        </Grid>

        {/* Attributes & Skills */}
        <StatsAndSkills />
        
        {/* Inventory Management */}
        <Grid size={{ xs: 12 }}>
          <InventoryManager />
        </Grid>

        {/* Finances & Banking */}
        <Grid size={{ xs: 12 }}>
          <FinancesAndBanking />
        </Grid>

        {/* Quest Progress & Global Flags */}
        <Grid size={{ xs: 12 }}>
          <QuestProgress />
        </Grid>
      </Grid>
    </Box>
  );
}
