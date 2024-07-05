'use client';

import { forwardRef, type PropsWithChildren } from 'react';
import CloseIcon from '@mui/icons-material/Close';
import { type TransitionProps } from '@mui/material/transitions';
import {
  Dialog,
  DialogTitle,
  type DialogTitleProps,
  type DialogProps,
  Typography,
  AppBar,
  Toolbar,
  IconButton,
  Slide,
} from '@mui/material';

type Props = PropsWithChildren<{
  title: string;
  titleProps?: DialogTitleProps;
  dialogProps: DialogProps;
}>;
export default function BasicModal({
  titleProps,
  title,
  dialogProps,
  children,
}: Props) {
  const { open, fullScreen, onClose } = dialogProps;

  if (fullScreen) {
    return (
      <Dialog
        {...dialogProps}
        fullScreen
        open={open}
        onClose={onClose}
        TransitionComponent={Transition}
      >
        <AppBar sx={{ position: 'relative' }}>
          <Toolbar>
            <IconButton
              edge="start"
              color="inherit"
              onClick={onClose}
              aria-label="close"
            >
              <CloseIcon />
            </IconButton>
            <Typography sx={{ ml: 2, flex: 1 }} variant="h6" component="div">
              {title}
            </Typography>
          </Toolbar>
        </AppBar>
        <div className="flex min-h-screen items-start justify-center pt-5">
          {children}
        </div>
      </Dialog>
    );
  }

  return (
    <Dialog {...dialogProps} open={open} onClose={onClose ?? undefined}>
      <DialogTitle {...titleProps}>{title}</DialogTitle>
      {children}
    </Dialog>
  );
}

const Transition = forwardRef(function Transition(
  props: TransitionProps & {
    children: React.ReactElement;
  },
  ref: React.Ref<unknown>,
) {
  return <Slide direction="up" ref={ref} {...props} />;
});
