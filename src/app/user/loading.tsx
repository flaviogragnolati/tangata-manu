import { CircularProgress } from '@mui/material';

export default function Loading() {
  return (
    <CircularProgress
      color="primary"
      size={100}
      thickness={5}
      className="flex min-h-screen flex-col items-center justify-center"
    />
  );
}
