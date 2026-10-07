import { Component, type ErrorInfo, type ReactNode } from 'react';
import { Alert, AlertTitle, Box, Button, CssBaseline, Paper, Stack, Typography } from '@mui/material';
import { recordError } from '../../utils/errorReport';
import { ErrorReportView } from './ErrorReportView';

interface Props {
  /** Shown to the user and in the report, e.g. "Inventory". */
  name: string;
  /** "section" replaces one part of the page; "app" replaces the whole window. */
  variant?: 'section' | 'app';
  /** Clears the error when it changes, e.g. when another save is loaded. */
  resetKey?: unknown;
  children: ReactNode;
}

interface State {
  error: unknown;
  componentStack: string | null;
  hasError: boolean;
}

/**
 * Catches errors while rendering its children. Without one, React unmounts the whole app and the
 * window goes blank. With one per section, the rest of the editor (including Save) keeps working.
 */
export class ErrorBoundary extends Component<Props, State> {
  state: State = { error: null, componentStack: null, hasError: false };

  static getDerivedStateFromError(error: unknown): Partial<State> {
    return { error, hasError: true };
  }

  componentDidCatch(error: unknown, info: ErrorInfo) {
    recordError(this.props.name, error);
    this.setState({ componentStack: info.componentStack ?? null });
    console.error(`[${this.props.name}]`, error, info.componentStack);
  }

  componentDidUpdate(prevProps: Props) {
    if (this.state.hasError && prevProps.resetKey !== this.props.resetKey) this.reset();
  }

  reset = () => this.setState({ error: null, componentStack: null, hasError: false });

  render() {
    if (!this.state.hasError) return this.props.children;
    const { name, variant = 'section' } = this.props;
    const report = <ErrorReportView where={name} error={this.state.error} componentStack={this.state.componentStack} />;

    if (variant === 'app') {
      return (
        <Box sx={{ p: 4, maxWidth: 900, mx: 'auto' }}>
          <CssBaseline />
          <Typography variant="h4" gutterBottom>Something went wrong</Typography>
          <Typography sx={{ mb: 2 }}>
            The editor hit an error it couldn't recover from. Copy the report below and send it with your bug report.
            It doesn't contain your save data. Reloading starts the editor again; unsaved changes will be lost.
          </Typography>
          {report}
          <Stack direction="row" spacing={2} sx={{ mt: 3 }}>
            <Button variant="outlined" onClick={this.reset}>Try again</Button>
            <Button variant="outlined" color="warning" onClick={() => window.location.reload()}>Reload editor</Button>
          </Stack>
        </Box>
      );
    }

    return (
      <Paper sx={{ p: 3, borderRadius: 2 }}>
        <Alert severity="error" sx={{ mb: 2 }}>
          <AlertTitle>{name} couldn't be shown</AlertTitle>
          The rest of the editor still works, and you can still save your other changes. Copy the report below and
          send it with your bug report; it doesn't contain your save data.
        </Alert>
        {report}
        <Button sx={{ mt: 2 }} variant="outlined" onClick={this.reset}>Try again</Button>
      </Paper>
    );
  }
}
