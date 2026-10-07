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
import { LegalStanding } from '../components/LegalStanding';
import { LocationAndWorldData } from '../components/LocationAndWorldData';
import { SaveBrowser } from '../components/SaveBrowser';
import { ErrorBoundary } from '../components/errors/ErrorBoundary';

// Stats & Skills lays out its own grid items, so it gets a nested container.
const StatsAndSkillsSection = () => (
  <Grid container spacing={4}>
    <StatsAndSkills />
  </Grid>
);

const SECTIONS = [
  { name: 'Character Basics', Component: CharacterBasics },
  { name: 'Career & Advantages', Component: CareerAndAdvantages },
  { name: 'Stats & Skills', Component: StatsAndSkillsSection },
  { name: 'Inventory', Component: InventoryManager },
  { name: 'Finances & Banking', Component: FinancesAndBanking },
  { name: 'Factions & Reputation', Component: FactionsAndReputation },
  { name: 'All Faction Reputations', Component: AllReputations },
  { name: 'Crime & Legal Standing', Component: LegalStanding },
  { name: 'Main Quest Progress', Component: MainQuestProgress },
  { name: 'Quest Flags', Component: QuestProgress },
  { name: 'Location & World Data', Component: LocationAndWorldData },
];

export default function Home() {
  const saveData = useSaveStore((state) => state.saveData);
  const currentFilePath = useSaveStore((state) => state.currentFilePath);

  if (!saveData || !saveData.playerData?.playerEntity) {
    return (
      <Box sx={{ maxWidth: 1000, mx: 'auto' }}>
        <ErrorBoundary name="Save browser">
          <SaveBrowser />
        </ErrorBoundary>
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
        {SECTIONS.map(({ name, Component }) => (
          <Grid key={name} size={{ xs: 12 }}>
            {/* One failing section shows an error report instead of blanking the whole sheet. */}
            <ErrorBoundary name={name} resetKey={currentFilePath}>
              <Component />
            </ErrorBoundary>
          </Grid>
        ))}
      </Grid>
    </Box>
  );
}
