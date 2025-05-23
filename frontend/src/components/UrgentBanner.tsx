import { Box, Typography, Button } from '@mui/material';
import WarningAmberIcon from '@mui/icons-material/WarningAmber';
import { updateSongStatus } from '../services/api';

interface UrgentBannerProps {
  message: string;
  songId: number;
  onSongMarkedDone: () => void;
}

export default function UrgentBanner({ message, songId, onSongMarkedDone }: UrgentBannerProps) {
  const handleOkClick = async () => {
    try {
      await updateSongStatus(songId, 'DONE');
      onSongMarkedDone();
    } catch (error) {
      console.error('Error marking urgent song as done:', error);
    }
  };

  return (
    <Box
      sx={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        zIndex: 1100,
        backgroundColor: (theme) => theme.palette.warning.dark,
        color: (theme) => theme.palette.warning.contrastText,
        padding: '8px 12px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 2,
        boxShadow: '0 2px 4px rgba(0,0,0,0.2)',
      }}
    >
      <WarningAmberIcon sx={{ fontSize: '1.25rem' }} />
      <Typography variant="subtitle1" component="div" sx={{ fontWeight: 500 }}>
        {message}
      </Typography>
      <Button
        variant="text"
        size="small"
        onClick={handleOkClick}
        sx={{
          minWidth: 'auto',
          ml: 1,
          px: 1.5,
          py: 0.5,
          color: 'inherit',
          fontSize: '1rem',
          opacity: 0.8,
          textTransform: 'none',
          '&:hover': {
            opacity: 1,
            backgroundColor: 'rgba(255,255,255,0.1)',
          },
        }}
      >
        ok
      </Button>
    </Box>
  );
}
