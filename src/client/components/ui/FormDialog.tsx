'use client';

import {
  createContext,
  useContext,
  useState,
  type FormEventHandler,
  type ReactNode,
} from 'react';
import CloseIcon from '@mui/icons-material/Close';
import {
  Box,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
  IconButton,
  Typography,
  useMediaQuery,
} from '@mui/material';
import { useTheme } from '@mui/material/styles';

const RequestCloseContext = createContext<() => void>(() => undefined);

type Props = {
  open: boolean;
  title: string;
  subtitle?: ReactNode;
  onClose: () => void;
  /** Ask before discarding unsaved changes. */
  dirty?: boolean;
  maxWidth?: 'sm' | 'md';
  /** Renders its own `FormDialogForm` with `DialogContent` and `FormDialogActions`. */
  children: ReactNode;
};

/** Centered dialog on desktop, full screen on phones. */
export default function FormDialog({
  open,
  title,
  subtitle,
  onClose,
  dirty = false,
  maxWidth = 'sm',
  children,
}: Props) {
  const theme = useTheme();
  // Safe from hydration mismatch: the dialog always mounts closed
  const fullScreen = useMediaQuery(theme.breakpoints.down('sm'));
  const [confirming, setConfirming] = useState(false);

  const requestClose = () => (dirty ? setConfirming(true) : onClose());

  return (
    <>
      <Dialog
        open={open}
        onClose={requestClose}
        fullWidth
        maxWidth={maxWidth}
        fullScreen={fullScreen}
        aria-labelledby="form-dialog-title"
      >
        <DialogTitle
          component="div"
          sx={{ display: 'flex', alignItems: 'flex-start', gap: 1, pr: 1.5 }}
        >
          <Box sx={{ flex: 1, minWidth: 0 }}>
            <Typography variant="h6" component="h2" id="form-dialog-title">
              {title}
            </Typography>
            {subtitle && (
              <Typography variant="body2" color="text.secondary">
                {subtitle}
              </Typography>
            )}
          </Box>
          <IconButton aria-label="Cerrar" onClick={requestClose}>
            <CloseIcon />
          </IconButton>
        </DialogTitle>
        <RequestCloseContext.Provider value={requestClose}>
          {children}
        </RequestCloseContext.Provider>
      </Dialog>

      <Dialog open={confirming} onClose={() => setConfirming(false)}>
        <DialogContent>
          <DialogContentText>
            Hay cambios sin guardar. ¿Descartarlos?
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setConfirming(false)}>Seguir editando</Button>
          <Button
            color="error"
            onClick={() => {
              setConfirming(false);
              onClose();
            }}
          >
            Descartar
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
}

/** Actions pinned to the bottom so they stay visible with the keyboard open. */
export function FormDialogActions({ children }: { children: ReactNode }) {
  return (
    <DialogActions
      sx={{
        position: 'sticky',
        bottom: 0,
        bgcolor: 'background.paper',
        borderTop: 1,
        borderColor: 'divider',
        px: 3,
        py: 1.5,
      }}
    >
      {children}
    </DialogActions>
  );
}

/** Keeps the content scrollable between the title and the pinned actions. */
export function FormDialogForm({
  onSubmit,
  children,
}: {
  onSubmit: FormEventHandler<HTMLFormElement>;
  children: ReactNode;
}) {
  return (
    <Box
      component="form"
      noValidate
      onSubmit={onSubmit}
      sx={{ display: 'flex', flexDirection: 'column', flex: 1, minHeight: 0 }}
    >
      {children}
    </Box>
  );
}

/** "Cancelar" that goes through the unsaved-changes check. */
export function FormDialogCancel({ label = 'Cancelar' }: { label?: string }) {
  const requestClose = useContext(RequestCloseContext);
  return <Button onClick={requestClose}>{label}</Button>;
}
