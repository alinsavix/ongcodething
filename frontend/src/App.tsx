import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { ThemeProvider, createTheme } from '@mui/material';
import CssBaseline from '@mui/material/CssBaseline';
import SongList from './components/SongList';
import SongDetails from './components/SongDetails';
import ConnectionStatus from './components/ConnectionStatus';

const theme = createTheme({
  palette: {
    mode: 'dark',
    primary: {
      main: '#90caf9',  // A lighter blue that works well in dark mode
    },
    secondary: {
      main: '#f48fb1',  // A lighter pink that works well in dark mode
    },
    background: {
      default: '#121212',  // Material Design recommended dark background
      paper: '#1e1e1e',    // Slightly lighter than the background for cards
    },
    text: {
      primary: '#ffffff',
      secondary: 'rgba(255, 255, 255, 0.7)',
    },
    success: {
      main: '#66bb6a',  // A green that works well in dark mode
    },
    error: {
      main: '#f44336',  // A red that works well in dark mode
    },
  },
  components: {
    MuiButton: {
      styleOverrides: {
        root: {
          fontSize: '1.1rem',
          padding: '12px 24px',
        },
      },
    },
    MuiIconButton: {
      styleOverrides: {
        root: {
          '&:hover': {
            backgroundColor: 'rgba(255, 255, 255, 0.08)',
          },
        },
      },
    },
    MuiPaper: {
      styleOverrides: {
        root: {
          backgroundImage: 'none',  // Remove the default paper pattern
        },
      },
    },
    MuiListItem: {
      styleOverrides: {
        root: {
          '&:hover': {
            backgroundColor: 'rgba(255, 255, 255, 0.05)',
          },
        },
      },
    },
    MuiTypography: {
      styleOverrides: {
        root: {
          userSelect: 'none', // Better touch experience
        },
      },
    },
  },
});

function App() {
  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <ConnectionStatus />
      <Router>
        <Routes>
          <Route path="/" element={<SongList />} />
          <Route path="/song/:id" element={<SongDetails />} />
        </Routes>
      </Router>
    </ThemeProvider>
  );
}

export default App;
