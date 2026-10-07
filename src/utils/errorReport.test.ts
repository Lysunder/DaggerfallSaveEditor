import { describe, expect, it } from 'vitest';
import { buildErrorReport, describeError, isIgnorableError, recordError, redactPaths } from './errorReport';

describe('error reports', () => {
  it('describes any thrown value', () => {
    expect(describeError(new TypeError('x is undefined')).message).toBe('TypeError: x is undefined');
    expect(describeError('boom').message).toBe('boom');
    expect(describeError({ code: 3 }).message).toBe('{"code":3}');
    expect(describeError(undefined).message).toBe('undefined');
  });

  it('removes user names from paths', () => {
    expect(redactPaths('at file:///C:/Users/Lys Smith/AppData/x.js:1:2')).toBe('at file:///C:/Users/<user>/AppData/x.js:1:2');
    expect(redactPaths('C:\\Users\\lys\\Saves')).toBe('C:\\Users\\<user>\\Saves');
    expect(redactPaths('/home/lys/app and /Users/lys/app')).toBe('/home/<user>/app and /Users/<user>/app');
  });

  it('includes the error, components, save state and earlier errors', () => {
    const error = new Error('Cannot read properties of undefined');
    const report = buildErrorReport(
      { appVersion: '1.0.9', userAgent: 'Electron', where: 'Inventory', error, componentStack: '\n    at InventoryManager', saveLoaded: true, unsavedChanges: 2 },
      [{ time: 't', source: 'Unexpected error', message: 'Earlier problem' }],
    );
    expect(report).toContain('Version: 1.0.9');
    expect(report).toContain('Where: Inventory');
    expect(report).toContain('Save loaded: yes (2 unsaved changes)');
    expect(report).toContain('Error: Error: Cannot read properties of undefined');
    expect(report).toContain('Components:\nat InventoryManager');
    expect(report).toContain('- t [Unexpected error] Earlier problem');
  });

  it('keeps only the most recent errors', () => {
    for (let i = 0; i < 15; i++) recordError('test', `error ${i}`);
    const report = buildErrorReport({ appVersion: '1', userAgent: '', where: 'x', error: 'now' });
    expect(report).toContain('error 14');
    expect(report).not.toContain('error 9\n');
  });

  it('ignores resize observer noise', () => {
    expect(isIgnorableError('ResizeObserver loop completed with undelivered notifications.')).toBe(true);
    expect(isIgnorableError('TypeError: boom')).toBe(false);
  });
});
