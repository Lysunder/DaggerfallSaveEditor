import { useMemo } from 'react';
import {
  Alert, Box, Chip, Grid, LinearProgress, Link, Paper, Stack, Step, StepLabel, Stepper, Tooltip, Typography,
} from '@mui/material';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import CancelIcon from '@mui/icons-material/Cancel';
import PlayCircleIcon from '@mui/icons-material/PlayCircle';
import HelpIcon from '@mui/icons-material/Help';
import MailIcon from '@mui/icons-material/Mail';
import RadioButtonUncheckedIcon from '@mui/icons-material/RadioButtonUnchecked';
import LockIcon from '@mui/icons-material/Lock';
import { useSaveStore } from '../store/useSaveStore';
import { computeMainQuestProgress, type QuestProgress, type QuestStatus } from '../utils/mainQuestProgress';

const STATUS_DISPLAY: Record<QuestStatus, { label: string; color: string; Icon: typeof CheckCircleIcon }> = {
  completed: { label: 'Completed', color: 'success.main', Icon: CheckCircleIcon },
  failed: { label: 'Failed', color: 'error.main', Icon: CancelIcon },
  active: { label: 'In progress', color: 'primary.main', Icon: PlayCircleIcon },
  started: { label: 'Started, outcome unknown', color: 'warning.main', Icon: HelpIcon },
  invited: { label: 'Invited', color: 'info.main', Icon: MailIcon },
  available: { label: 'Available', color: 'text.primary', Icon: RadioButtonUncheckedIcon },
  locked: { label: 'Locked', color: 'text.disabled', Icon: LockIcon },
};

const QuestStep = ({ quest, ...stepProps }: { quest: QuestProgress }) => {
  const { label, color, Icon } = STATUS_DISPLAY[quest.status];
  const tooltip = (
    <Box>
      <Typography variant="caption" sx={{ display: 'block' }}>
        {quest.def.dfuName} ({quest.def.id}){quest.def.required ? '' : ' · optional'}
      </Typography>
      {quest.evidence.map((line) => (
        <Typography key={line} variant="caption" sx={{ display: 'block' }}>• {line}</Typography>
      ))}
    </Box>
  );

  return (
    <Step {...stepProps} completed={quest.status === 'completed'} active={quest.status === 'active'}>
      <StepLabel
        error={quest.status === 'failed'}
        slots={{ stepIcon: () => <Icon sx={{ color }} fontSize="small" /> }}
        optional={
          <Stack direction="row" spacing={0.5} sx={{ alignItems: 'center' }}>
            <Typography variant="caption" sx={{ color }}>{label}</Typography>
            {quest.inferred && quest.status !== 'locked' && quest.status !== 'available' && (
              <Chip label="inferred" size="small" variant="outlined" sx={{ height: 16, fontSize: '0.65rem' }} />
            )}
            {!quest.def.required && <Chip label="optional" size="small" variant="outlined" sx={{ height: 16, fontSize: '0.65rem' }} />}
          </Stack>
        }
      >
        <Tooltip title={tooltip} placement="right">
          <Link href={quest.def.uespUrl} target="_blank" rel="noreferrer" underline="hover" color="inherit">
            {quest.def.uespName}
          </Link>
        </Tooltip>
      </StepLabel>
    </Step>
  );
};

export const MainQuestProgress = () => {
  const saveData = useSaveStore((state) => state.saveData);
  const questData = useSaveStore((state) => state.questData);
  const notebookData = useSaveStore((state) => state.notebookData);

  const playerEntity = saveData?.playerData?.playerEntity;
  const globalVars = playerEntity?.globalVars;
  const playerLevel = playerEntity?.level ?? 1;

  const progress = useMemo(
    () => computeMainQuestProgress({ questData, notebookData, globalVars: globalVars ?? [], playerLevel }),
    [questData, notebookData, globalVars, playerLevel],
  );

  if (!playerEntity) {
    return null;
  }

  const percentage = progress.requiredTotal ? (progress.requiredDone / progress.requiredTotal) * 100 : 0;

  return (
    <Paper sx={{ p: 3, borderRadius: 2, backgroundImage: 'linear-gradient(rgba(255, 213, 79, 0.05), rgba(255, 255, 255, 0))' }}>
      <Typography variant="h5" color="warning.light" gutterBottom>
        Main Quest Progress
      </Typography>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
        Read-only. Finished quests are removed from the save a week after they end, so some steps are inferred from the
        journal, global flags and the main quest backbone. Hover a quest to see why it has its status.
      </Typography>

      {progress.partial && (
        <Alert severity="info" sx={{ mb: 2 }}>
          {questData
            ? 'The main quest backbone (S0000999) is not in QuestData.txt, so branch availability cannot be determined.'
            : 'QuestData.txt was not found next to this save, so progress is based on global flags and the journal only.'}
        </Alert>
      )}

      <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
        <Box sx={{ width: '100%', mr: 2 }}>
          <LinearProgress variant="determinate" value={percentage} sx={{ height: 10, borderRadius: 5 }} color="warning" />
        </Box>
        <Typography variant="body2" color="text.secondary" sx={{ whiteSpace: 'nowrap' }}>
          {progress.requiredDone} / {progress.requiredTotal} required quests
        </Typography>
      </Box>

      <Stack direction="row" spacing={1} sx={{ mb: 3, flexWrap: 'wrap' }} useFlexGap>
        <Chip size="small" label={progress.curseLifted ? 'Curse lifted' : 'Curse not lifted'} color={progress.curseLifted ? 'success' : 'default'} />
        <Chip size="small" label={progress.totemHolder ? `Totem: ${progress.totemHolder}` : 'Totem not yet given'} />
        <Chip size="small" label={progress.ending ? `Ending: ${progress.ending}` : 'No ending yet'} color={progress.ending ? 'warning' : 'default'} />
      </Stack>

      {progress.active.map(({ def, journal }) => (
        <Alert key={def.id} severity="info" icon={<PlayCircleIcon />} sx={{ mb: 2 }}>
          <Typography variant="subtitle2">Current quest: {def.uespName}</Typography>
          {journal.length > 0 ? journal.map((text, i) => <Typography key={i} variant="body2" sx={{ mt: 1 }}>{text}</Typography>) : (
            <Typography variant="body2">No journal entry yet.</Typography>
          )}
        </Alert>
      ))}

      <Grid container spacing={2}>
        {progress.branches.map(({ branch, quests, hint }) => (
          <Grid key={branch.key} size={{ xs: 12, sm: 6, md: 4, lg: 3 }}>
            <Paper variant="outlined" sx={{ p: 2, height: '100%' }}>
              <Typography variant="subtitle1" gutterBottom>{branch.title}</Typography>
              {hint && (
                <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 1 }}>
                  {hint}
                </Typography>
              )}
              <Stepper orientation="vertical" nonLinear>
                {quests.map((quest) => <QuestStep key={quest.def.id} quest={quest} />)}
              </Stepper>
            </Paper>
          </Grid>
        ))}
      </Grid>
    </Paper>
  );
};
