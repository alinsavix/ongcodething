import { useEffect, useState } from 'react';
import { Box, Tooltip, alpha } from '@mui/material';
import WifiIcon from '@mui/icons-material/Wifi';
import WifiOffIcon from '@mui/icons-material/WifiOff';
import RestartAltIcon from '@mui/icons-material/RestartAlt';
import { socket, reconnectSocket } from '../services/api';

export default function ConnectionStatus() {
  const [isConnected, setIsConnected] = useState(socket.connected);
  const [isReconnecting, setIsReconnecting] = useState(false);
  const [reconnectionExhausted, setReconnectionExhausted] = useState(false);

  useEffect(() => {
    function onConnect() {
      setIsConnected(true);
      setIsReconnecting(false);
      setReconnectionExhausted(false);
    }

    function onDisconnect() {
      setIsConnected(false);
      setIsReconnecting(true);
    }

    function onReconnectFailed() {
      setIsReconnecting(false);
      setReconnectionExhausted(true);
    }

    socket.on('connect', onConnect);
    socket.on('disconnect', onDisconnect);
    socket.on('reconnect_failed', onReconnectFailed);

    return () => {
      socket.off('connect', onConnect);
      socket.off('disconnect', onDisconnect);
      socket.off('reconnect_failed', onReconnectFailed);
    };
  }, []);

  const handleClick = () => {
    if (reconnectionExhausted) {
      setIsReconnecting(true);
      setReconnectionExhausted(false);
      reconnectSocket();
    }
  };

  const getIcon = () => {
    if (isConnected) {
      return <WifiIcon fontSize="medium" />;
    }
    if (reconnectionExhausted) {
      return (
        <RestartAltIcon
          fontSize="medium"
          sx={{
            animation: 'none'
          }}
        />
      );
    }
    return (
      <WifiOffIcon
        fontSize="medium"
        sx={{
          animation: 'pulse 2s infinite'
        }}
      />
    );
  };

  const getTooltipTitle = () => {
    if (isConnected) return 'Connected to server';
    if (reconnectionExhausted) return 'Click to try reconnecting';
    return 'Disconnected from server' + (isReconnecting ? ' (trying to reconnect...)' : '');
  };

  return (
    <Box
      sx={{
        position: 'fixed',
        top: 16,
        right: 16,
        zIndex: 1000,
      }}
    >
      <Tooltip title={getTooltipTitle()}>
        <Box
          onClick={handleClick}
          sx={{
            display: 'flex',
            alignItems: 'center',
            gap: 1,
            padding: '8px 12px',
            borderRadius: 2,
            backgroundColor: (theme) =>
              alpha(
                isConnected ? theme.palette.success.main : theme.palette.error.main,
                0.1
              ),
            color: (theme) =>
              isConnected ? theme.palette.success.main : theme.palette.error.main,
            transition: 'all 0.3s ease',
            cursor: reconnectionExhausted ? 'pointer' : 'help',
            '&:hover': reconnectionExhausted ? {
              backgroundColor: (theme) =>
                alpha(theme.palette.error.main, 0.2),
            } : undefined,
          }}
        >
          {getIcon()}
        </Box>
      </Tooltip>
    </Box>
  );
}
