import { Typography, Box, Grid } from '@mui/material';
import { useSaveStore } from '../store/useSaveStore';
import { CharacterBasics } from '../components/CharacterBasics';
import { CareerAndAdvantages } from '../components/CareerAndAdvantages';
import { StatsAndSkills } from '../components/StatsAndSkills';
import { InventoryManager } from '../components/InventoryManager';
import { FinancesAndBanking } from '../components/FinancesAndBanking';
import { QuestProgress } from '../components/QuestProgress';
import { MainQuestProgress } from '../components/MainQuestProgress';
import { FactionsAndReputation } from '../components/FactionsAndReputation';
import { AllReputations } from '../components/AllReputations';
import { LocationAndWorldData } from '../components/LocationAndWorldData';
import { SaveBrowser } from '../components/SaveBrowser';

export default function Home() {
  const saveData = useSaveStore((state) => state.saveData);

  if (!saveData || !saveData.playerData?.playerEntity) {
    return (
      <Box sx={{ maxWidth: 1000, mx: 'auto' }}>
        <SaveBrowser />
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
        
        {/* Career & Advantages */}
        <Grid size={{ xs: 12 }}>
          <CareerAndAdvantages />
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

        {/* Factions & Reputation */}
        <Grid size={{ xs: 12 }}>
          <FactionsAndReputation />
        </Grid>

        {/* All Reputations */}
        <Grid size={{ xs: 12 }}>
          <AllReputations />
        </Grid>

        {/* Main Quest Progress */}
        <Grid size={{ xs: 12 }}>
          <MainQuestProgress />
        </Grid>

        {/* Quest Progress & Global Flags */}
        <Grid size={{ xs: 12 }}>
          <QuestProgress />
        </Grid>

        {/* Location & World Data */}
        <Grid size={{ xs: 12 }}>
          <LocationAndWorldData />
        </Grid>
      </Grid>
    </Box>
  );
}
