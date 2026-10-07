import { useEffect, useState } from 'react';
import { Alert, Button, Dialog, DialogActions, DialogContent, DialogTitle, Snackbar, Typography } from '@mui/material';
import { describeError, isIgnorableError, recordError, type RecordedError } from '../../utils/errorReport';
import { ErrorReportView } from './ErrorReportView';

/**
 * Errors outside rendering (event handlers, timers, promises) don't blank the window, but can leave
 * a feature silently broken. Reports them with a notice that opens the same copyable report.
 */
export const GlobalErrorHandler = () => {
  const [latest, setLatest] = useState<{ entry: RecordedError; error: unknown } | null>(null);
  const [noticeOpen, setNoticeOpen] = useState(false);
  const [detailsOpen, setDetailsOpen] = useState(false);

  useEffect(() => {
    const report = (source: string, error: unknown) => {
      if (isIgnorableError(describeError(error).message)) return;
      const entry = recordError(source, error);
      setLatest({ entry, error });
      setNoticeOpen(true);
    };
    const onError = (event: ErrorEvent) => report('Unexpected error', event.error ?? event.message);
    const onRejection = (event: PromiseRejectionEvent) => report('Unhandled promise rejection', event.reason);
    window.addEventListener('error', onError);
    window.addEventListener('unhandledrejection', onRejection);
    return () => {
      window.removeEventListener('error', onError);
      window.removeEventListener('unhandledrejection', onRejection);
    };
  }, []);

  if (!latest) return null;
  return (
    <>
      <Snackbar open={noticeOpen} anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}>
        <Alert
          severity="error"
          onClose={() => setNoticeOpen(false)}
          action={<Button color="inherit" size="small" onClick={() => { setNoticeOpen(false); setDetailsOpen(true); }}>Details</Button>}
        >
          Something went wrong: {latest.entry.message}
        </Alert>
      </Snackbar>
      <Dialog open={detailsOpen} onClose={() => setDetailsOpen(false)} fullWidth maxWidth="md">
        <DialogTitle>Error details</DialogTitle>
        <DialogContent>
          <Typography variant="body2" sx={{ mb: 2 }}>
            Copy this report and send it with your bug report. It doesn't contain your save data.
          </Typography>
          <ErrorReportView where={latest.entry.source} error={latest.error} />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDetailsOpen(false)}>Close</Button>
        </DialogActions>
      </Dialog>
    </>
  );
};
