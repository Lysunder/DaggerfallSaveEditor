import { createContext, useContext } from 'react';

export interface ConfirmAction {
  value: string;
  label: string;
  color?: 'primary' | 'error' | 'inherit';
  variant?: 'text' | 'contained';
}

export interface ConfirmOptions {
  title: string;
  message: string;
  actions: ConfirmAction[];
  /** Returned when the dialog is dismissed with Escape or a click outside. */
  cancelValue: string;
}

export const ConfirmContext = createContext<((options: ConfirmOptions) => Promise<string>) | undefined>(undefined);

/** Shows a confirmation dialog and resolves with the chosen action's value. */
export const useConfirm = () => {
  const confirm = useContext(ConfirmContext);
  if (!confirm) throw new Error('useConfirm must be used within a ConfirmProvider');
  return confirm;
};
