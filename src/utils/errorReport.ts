// Builds the error report users copy and send when something breaks. Kept free of React so it can
// be used from error boundaries, global error handlers and tests alike.

export interface RecordedError {
  time: string;
  /** Where it was caught, e.g. "Inventory" or "Unhandled promise rejection". */
  source: string;
  message: string;
  stack?: string;
}

const MAX_RECENT = 10;
const recent: RecordedError[] = [];

/** Message and stack of anything thrown, including non-Error values. */
export const describeError = (error: unknown): { message: string; stack?: string } => {
  if (error instanceof Error) return { message: `${error.name}: ${error.message}`, stack: error.stack };
  if (typeof error === 'string') return { message: error };
  try {
    return { message: JSON.stringify(error) ?? String(error) };
  } catch {
    return { message: String(error) };
  }
};

/** Browser noise that isn't a bug (MUI's DataGrid can trigger it while resizing). */
export const isIgnorableError = (message: string) => /ResizeObserver loop/i.test(message);

/** Keeps the error so later reports can list it. */
export const recordError = (source: string, error: unknown): RecordedError => {
  const entry = { time: new Date().toISOString(), source, ...describeError(error) };
  recent.push(entry);
  if (recent.length > MAX_RECENT) recent.shift();
  return entry;
};

/** Replaces the user's name in file paths ("C:\Users\Lys\…", "/home/lys/…") so reports don't reveal it. */
export const redactPaths = (text: string) =>
  text
    .replace(/([A-Za-z]:[\\/]+Users[\\/]+)[^\\/:\n]+/gi, '$1<user>')
    .replace(/(\/(?:Users|home)\/)[^/:\n]+/g, '$1<user>');

export interface ReportContext {
  appVersion: string;
  userAgent: string;
  /** The section or area that failed. */
  where: string;
  error: unknown;
  /** React's component stack, from an error boundary. */
  componentStack?: string | null;
  saveLoaded?: boolean;
  unsavedChanges?: number;
}

/** Plain-text report for the user to copy. Contains no save data. */
export const buildErrorReport = (context: ReportContext, history: readonly RecordedError[] = recent): string => {
  const { message, stack } = describeError(context.error);
  const lines = [
    'Daggerfall Unity Save Editor – error report',
    `Version: ${context.appVersion}`,
    `Time: ${new Date().toISOString()}`,
    `Where: ${context.where}`,
    `System: ${context.userAgent}`,
  ];
  if (context.saveLoaded !== undefined) {
    lines.push(`Save loaded: ${context.saveLoaded ? 'yes' : 'no'}${context.unsavedChanges ? ` (${context.unsavedChanges} unsaved changes)` : ''}`);
  }
  lines.push('', `Error: ${message}`);
  if (stack) lines.push('', 'Stack:', stack);
  if (context.componentStack) {
    // The innermost components are what matter; the rest is the same app shell every time.
    const components = context.componentStack.trim().split('\n').slice(0, 15).map((line) => line.trim());
    lines.push('', 'Components:', ...components);
  }

  const earlier = history.filter((entry) => entry.message !== message).slice(-5);
  if (earlier.length > 0) {
    lines.push('', 'Earlier errors:');
    for (const entry of earlier) lines.push(`- ${entry.time} [${entry.source}] ${entry.message}`);
  }
  return redactPaths(lines.join('\n'));
};

/** Copies via the main process (reliable under file://), falling back to the browser clipboard. */
export const copyText = async (text: string): Promise<boolean> => {
  try {
    if (window.ipcRenderer?.copyText) {
      await window.ipcRenderer.copyText(text);
      return true;
    }
    await navigator.clipboard.writeText(text);
    return true;
  } catch {
    return false;
  }
};
