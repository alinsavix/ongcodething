import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Container,
  Paper,
  Typography,
  Button,
  Box,
  CircularProgress,
  alpha,
} from '@mui/material';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import NavigateNextIcon from '@mui/icons-material/NavigateNext';
import { Song, getSongById, updateSongStatus, getSongs } from '../services/api';

export default function SongDetails() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [song, setSong] = useState<Song | null>(null);
  const [allSongs, setAllSongs] = useState<Song[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadData = async () => {
      try {
        if (id) {
          const [songData, songsData] = await Promise.all([
            getSongById(parseInt(id)),
            getSongs()
          ]);
          setSong(songData);
          setAllSongs(songsData);
        }
      } catch (error) {
        console.error('Error loading data:', error);
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [id]);

  const handleStatusUpdate = async (status: 'DONE' | 'SKIPPED') => {
    if (id) {
      try {
        await updateSongStatus(parseInt(id), status);
        navigate('/');
      } catch (error) {
        console.error(`Error marking song as ${status.toLowerCase()}:`, error);
      }
    }
  };

  const getNextSong = () => {
    if (!song || !allSongs.length) return null;

    // Sort songs by creation date
    const sortedSongs = [...allSongs].sort(
      (a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
    );

    // Find current song index
    const currentIndex = sortedSongs.findIndex(s => s.song_id === song.song_id);

    // Return next song if it exists
    return currentIndex < sortedSongs.length - 1 ? sortedSongs[currentIndex + 1] : null;
  };

  const nextSong = getNextSong();

  if (loading) {
    return (
      <Container maxWidth="md" sx={{ py: 4, textAlign: 'center' }}>
        <CircularProgress />
      </Container>
    );
  }

  if (!song) {
    return (
      <Container maxWidth="md" sx={{ py: 4 }}>
        <Typography variant="h6" color="error" align="center">
          Song not found
        </Typography>
        <Box sx={{ mt: 2, textAlign: 'center' }}>
          <Button
            variant="contained"
            startIcon={<ArrowBackIcon />}
            onClick={() => navigate('/')}
          >
            Back
          </Button>
        </Box>
      </Container>
    );
  }

  return (
    <Container maxWidth="md" sx={{ py: 4 }}>
      <Box
        sx={{
          mb: 3,
          display: 'flex',
          gap: 2,
          alignItems: 'center'
        }}
      >
        <Button
          variant="outlined"
          startIcon={<ArrowBackIcon />}
          onClick={() => navigate('/')}
          sx={{
            borderColor: 'primary.main',
            color: 'primary.main',
            '&:hover': {
              borderColor: 'primary.light',
              backgroundColor: (theme) => alpha(theme.palette.primary.main, 0.1),
            },
          }}
        >
          Back
        </Button>
        {song.status === 'PENDING' && (
          <Button
            variant="contained"
            startIcon={<CheckCircleIcon />}
            onClick={() => handleStatusUpdate('DONE')}
            sx={{
              backgroundColor: 'primary.main',
              color: 'background.paper',
              '&:hover': {
                backgroundColor: 'primary.light',
              },
            }}
          >
            Done
          </Button>
        )}
        {/* Temporarily hidden Next Song button
        {nextSong && (
          <Button
            variant="contained"
            endIcon={<NavigateNextIcon />}
            onClick={() => navigate(`/song/${nextSong.song_id}`)}
            sx={{
              backgroundColor: 'success.main',
              color: 'background.paper',
              '&:hover': {
                backgroundColor: 'success.light',
              },
            }}
          >
            Next Song
          </Button>
        )}
        */}
      </Box>

      <Paper
        elevation={3}
        sx={{
          p: 4,
          backgroundColor: 'background.paper',
          borderRadius: 2,
        }}
      >
        <Typography
          variant="h4"
          component="h1"
          gutterBottom
          sx={{ color: 'primary.main' }}
        >
          {song.title}
        </Typography>

        <Typography
          variant="body1"
          component="pre"
          sx={{
            whiteSpace: 'pre-wrap',
            mt: 3,
            color: 'text.primary',
            fontSize: '1.1rem',
            lineHeight: 1.7,
            fontFamily: '"Courier New", Courier, monospace !important',
            backgroundColor: (theme) => alpha(theme.palette.background.default, 0.5),
            p: 2,
            borderRadius: 1,
            overflowX: 'auto',
            '& *': {
              fontFamily: '"Courier New", Courier, monospace !important',
            },
          }}
        >
          {song.body}
        </Typography>

        <Box sx={{ mt: 4 }}>
          <Typography
            variant="subtitle2"
            sx={{ color: 'text.secondary' }}
          >
            Created: {new Date(song.created_at).toLocaleString()}
          </Typography>
        </Box>
      </Paper>
    </Container>
  );
}
