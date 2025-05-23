import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Container,
  List,
  ListItem,
  ListItemText,
  Button,
  Box,
  Typography,
  Paper,
  IconButton,
  Tooltip,
  alpha,
  Collapse,
} from '@mui/material';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import SkipNextIcon from '@mui/icons-material/SkipNext';
import { Song, getSongs, updateSongStatus, socket } from '../services/api';
import UrgentBanner from './UrgentBanner';

export default function SongList() {
  const [songs, setSongs] = useState<Song[]>([]);
  const [urgentMessage, setUrgentMessage] = useState<string | null>(null);
  const [urgentSongId, setUrgentSongId] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [removingSongId, setRemovingSongId] = useState<number | null>(null);
  const navigate = useNavigate();

  const loadSongs = async () => {
    setError(null);
    setIsLoading(true);
    try {
      const data = await getSongs();
      if (!Array.isArray(data)) {
        console.error('Expected array but got:', data);
        setError('Invalid data format received from server');
        return;
      }
      processSongsData(data);
    } catch (error) {
      console.error('Error loading songs:', error);
      setError('Failed to load songs. Please check your connection and try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const processSongsData = (data: Song[]) => {
    const pendingSongs = data
      .filter(song => song.status === 'PENDING')
      .sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime());

    const urgentSong = pendingSongs.find(song => song.title.startsWith('URGENT:'));
    if (urgentSong) {
      setUrgentMessage(urgentSong.title.substring(7).trim());
      setUrgentSongId(urgentSong.song_id);
    } else {
      setUrgentMessage(null);
      setUrgentSongId(null);
    }

    setSongs(pendingSongs
      .filter(song => !song.title.startsWith('URGENT:'))
      .map(song => ({
        ...song,
        title: song.title
      }))
    );
  };

  useEffect(() => {
    loadSongs();

    socket.on('connect', () => {
      console.log('Connected to WebSocket');
    });

    socket.on('song_update', (data: { message: string; song: Song | null }) => {
      if (data.message === 'All songs cleared from database') {
        setSongs([]);
        setUrgentMessage(null);
        setUrgentSongId(null);
        return;
      }

      if (!data.song) return;

      const updatedSong = data.song;
      setSongs(prevSongs => {
        // If the song is being marked as done or skipped, remove it
        if (updatedSong.status !== 'PENDING') {
          return prevSongs.filter(song => song.song_id !== updatedSong.song_id);
        }

        // If it's a new song or an update to an existing song
        const existingIndex = prevSongs.findIndex(song => song.song_id === updatedSong.song_id);
        if (existingIndex === -1) {
          // New song - add it to the list
          return [...prevSongs, updatedSong].sort(
            (a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
          );
        } else {
          // Update existing song
          const newSongs = [...prevSongs];
          newSongs[existingIndex] = updatedSong;
          return newSongs;
        }
      });

      // Handle urgent message updates
      if (updatedSong.title.startsWith('URGENT:')) {
        setUrgentMessage(updatedSong.title.substring(7).trim());
        setUrgentSongId(updatedSong.song_id);
      } else if (urgentSongId === updatedSong.song_id) {
        setUrgentMessage(null);
        setUrgentSongId(null);
      }
    });

    return () => {
      socket.off('connect');
      socket.off('song_update');
    };
  }, []);

  const handleStatusUpdate = async (songId: number, newStatus: 'DONE' | 'SKIPPED') => {
    // Start the removal animation
    setRemovingSongId(songId);

    // Wait for the animation to complete before removing the item
    setTimeout(() => {
      setSongs(prevSongs => prevSongs.filter(song => song.song_id !== songId));
      setRemovingSongId(null);
    }, 300); // Match this with the Collapse timeout

    try {
      await updateSongStatus(songId, newStatus);
    } catch (error) {
      console.error('Error updating song status:', error);
      loadSongs();
    }
  };

  return (
    <>
      {urgentMessage && urgentSongId && (
        <UrgentBanner
          message={urgentMessage}
          songId={urgentSongId}
          onSongMarkedDone={loadSongs}
        />
      )}
      <Container maxWidth="md" sx={{ py: 4, mt: urgentMessage ? 8 : 0 }}>
        <Paper
          elevation={3}
          sx={{
            backgroundColor: 'background.paper',
            borderRadius: 2,
          }}
        >
          <List>
            {isLoading ? (
              <ListItem>
                <ListItemText
                  primary="Loading songs..."
                  sx={{
                    textAlign: 'center',
                    py: 4,
                    color: 'text.secondary',
                  }}
                />
              </ListItem>
            ) : error ? (
              <ListItem>
                <ListItemText
                  primary={error}
                  sx={{
                    textAlign: 'center',
                    py: 4,
                    color: 'error.main',
                  }}
                />
                <Button
                  variant="contained"
                  color="primary"
                  onClick={loadSongs}
                  sx={{ ml: 2 }}
                >
                  Retry
                </Button>
              </ListItem>
            ) : songs.length === 0 ? (
              <ListItem>
                <ListItemText
                  primary="No pending songs"
                  sx={{
                    textAlign: 'center',
                    py: 4,
                    color: 'text.secondary',
                  }}
                />
              </ListItem>
            ) : (
              songs.map((song) => (
                <Collapse
                  key={song.song_id}
                  in={removingSongId !== song.song_id}
                  timeout={300}
                  sx={{
                    '& .MuiCollapse-wrapper': {
                      transition: 'all 0.3s ease-in-out',
                    },
                  }}
                >
                  <ListItem
                    divider
                    sx={{
                      display: 'flex',
                      flexDirection: { xs: 'column', sm: 'row' },
                      alignItems: 'flex-start',
                      py: 2,
                      borderColor: 'rgba(255, 255, 255, 0.08)',
                      '&:hover': {
                        backgroundColor: 'rgba(255, 255, 255, 0.03)',
                      },
                      cursor: 'pointer',
                      transition: 'all 0.3s ease-in-out',
                      transform: removingSongId === song.song_id ? 'translateX(-100%)' : 'translateX(0)',
                      opacity: removingSongId === song.song_id ? 0 : 1,
                    }}
                  >
                    <Box
                      onClick={() => navigate(`/song/${song.song_id}`)}
                      sx={{
                        flex: 1,
                        width: '100%',
                        mb: { xs: 2, sm: 0 },
                      }}
                    >
                      <ListItemText
                        primary={song.title}
                        sx={{
                          '& .MuiListItemText-primary': {
                            color: 'text.primary',
                            fontSize: '1.1rem',
                          },
                        }}
                      />
                    </Box>
                    <Box
                      onClick={(e) => e.stopPropagation()}
                      sx={{
                        display: 'flex',
                        gap: 2,
                        width: { xs: '100%', sm: 'auto' },
                        justifyContent: { xs: 'space-between', sm: 'flex-end' },
                        alignItems: 'center',
                      }}
                    >
                      <Typography
                        component="span"
                        sx={{
                          color: 'text.secondary',
                          fontSize: '0.75rem',
                          fontFamily: 'monospace',
                          backgroundColor: (theme) => alpha(theme.palette.primary.main, 0.1),
                          px: 0.75,
                          py: 0.25,
                          borderRadius: 0.75,
                          minWidth: '2.5rem',
                          textAlign: 'center',
                        }}
                      >
                        #{song.song_id}
                      </Typography>
                      <Tooltip title="Mark Done">
                        <IconButton
                          color="primary"
                          onClick={() => handleStatusUpdate(song.song_id, 'DONE')}
                          size="large"
                          sx={{
                            p: 1,
                            backgroundColor: (theme) => alpha(theme.palette.primary.main, 0.1),
                            '&:hover': {
                              backgroundColor: (theme) => alpha(theme.palette.primary.main, 0.2),
                            },
                            transition: 'all 0.2s ease-in-out',
                          }}
                        >
                          <CheckCircleIcon />
                        </IconButton>
                      </Tooltip>
                      <Tooltip title="Skip">
                        <IconButton
                          color="secondary"
                          onClick={() => handleStatusUpdate(song.song_id, 'SKIPPED')}
                          size="large"
                          sx={{
                            p: 1,
                            backgroundColor: (theme) => alpha(theme.palette.secondary.main, 0.1),
                            '&:hover': {
                              backgroundColor: (theme) => alpha(theme.palette.secondary.main, 0.2),
                            },
                            transition: 'all 0.2s ease-in-out',
                          }}
                        >
                          <SkipNextIcon />
                        </IconButton>
                      </Tooltip>
                    </Box>
                  </ListItem>
                </Collapse>
              ))
            )}
          </List>
        </Paper>
      </Container>
    </>
  );
}
