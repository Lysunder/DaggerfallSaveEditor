import { useMemo, useState } from 'react';
import { Box, Button, Stack, TextField, Typography } from '@mui/material';
import ContentCopyIcon from '@mui/icons-material/ContentCopy';
import { useSaveStore } from '../../store/useSaveStore';
import { diffAll } from '../../utils/saveDiff';
import { buildErrorReport, copyText } from '../../utils/errorReport';

/** Unsaved state for the report. Read defensively: the store itself may be what's broken. */
const saveState = () => {
  try {
    const { saveData, factionData, baselineSaveData, baselineFactionData } = useSaveStore.getState();
    return {
      saveLoaded: !!saveData,
      unsavedChanges: diffAll(baselineSaveData, saveData, baselineFactionData, factionData).length,
    };
  } catch {
    return {};
  }
};

interface Props {
  where: string;
  error: unknown;
  componentStack?: string | null;
}

/** The copyable report, with a Copy button. */
export const ErrorReportView = ({ where, error, componentStack }: Props) => {
  const report = useMemo(
    () => buildErrorReport({
      appVersion: __APP_VERSION__,
      userAgent: navigator.userAgent,
      where,
      error,
      componentStack,
      ...saveState(),
    }),
    [where, error, componentStack],
  );
  const [copied, setCopied] = useState<boolean | null>(null);

  return (
    <Box>
      <TextField
        value={report}
        multiline
        fullWidth
        minRows={6}
        maxRows={14}
        slotProps={{ htmlInput: { readOnly: true, spellCheck: false, style: { fontFamily: 'monospace', fontSize: 12 } } }}
        onFocus={(e) => e.target.select()}
      />
      <Stack direction="row" spacing={2} sx={{ mt: 1, alignItems: 'center' }}>
        <Button variant="contained" startIcon={<ContentCopyIcon />} onClick={async () => setCopied(await copyText(report))}>
          Copy error report
        </Button>
        {copied === true && <Typography variant="body2" color="success.main">Copied. Paste it into your bug report.</Typography>}
        {copied === false && <Typography variant="body2" color="warning.main">Couldn't copy. Select the text above and press Ctrl+C.</Typography>}
      </Stack>
    </Box>
  );
};
