import React, { useCallback, useState } from 'react';
import { Button, Dialog, DialogActions, DialogContent, DialogContentText, DialogTitle } from '@mui/material';
import { ConfirmContext, type ConfirmOptions } from './confirm';

export function ConfirmProvider({ children }: { children: React.ReactNode }) {
  const [pending, setPending] = useState<{ options: ConfirmOptions; resolve: (value: string) => void } | null>(null);

  const confirm = useCallback(
    (options: ConfirmOptions) => new Promise<string>((resolve) => setPending({ options, resolve })),
    [],
  );

  const finish = (value: string) => {
    pending?.resolve(value);
    setPending(null);
  };

  return (
    <ConfirmContext.Provider value={confirm}>
      {children}
      <Dialog open={!!pending} onClose={() => finish(pending?.options.cancelValue ?? '')} maxWidth="xs" fullWidth>
        <DialogTitle>{pending?.options.title}</DialogTitle>
        <DialogContent>
          <DialogContentText>{pending?.options.message}</DialogContentText>
        </DialogContent>
        <DialogActions>
          {pending?.options.actions.map((action) => (
            <Button key={action.value} color={action.color ?? 'primary'} variant={action.variant ?? 'text'} onClick={() => finish(action.value)}>
              {action.label}
            </Button>
          ))}
        </DialogActions>
      </Dialog>
    </ConfirmContext.Provider>
  );
}
