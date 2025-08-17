import React from 'react';
import { Box, IconButton } from '@mui/material';
import { 
  WebAsset,
  Chat,
  ViewColumn
} from '@mui/icons-material';

type ViewMode = 'left-only' | 'right-only' | 'both';

interface ViewToggleProps {
  viewMode: ViewMode;
  onViewModeChange: (mode: ViewMode) => void;
}

const ViewToggle: React.FC<ViewToggleProps> = ({ viewMode, onViewModeChange }) => {
  const modes: { key: ViewMode; icon: React.ReactNode }[] = [
    { key: 'left-only', icon: <WebAsset fontSize="inherit" /> },
    { key: 'both', icon: <ViewColumn fontSize="inherit" /> },
    { key: 'right-only', icon: <Chat fontSize="inherit" /> },
  ];

  return (
    <Box
      sx={{
        position: 'fixed',
        bottom: '7px',
        right: '12px',
        display: 'flex',
        bgcolor: 'white',
        borderRadius: '20px',
        border: '1px solid #e2e8f0',
        boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
        overflow: 'hidden',
        zIndex: 1000,
      }}
    >
      {modes.map((mode, index) => (
        <IconButton
          key={mode.key}
          size="small"
          onClick={() => onViewModeChange(mode.key)}
          sx={{
            width: '24px',
            height: '20px',
            borderRadius: 0,
            bgcolor: viewMode === mode.key ? '#f1f5f9' : 'transparent',
            color: viewMode === mode.key ? '#64748b' : '#94a3b8',
            '&:hover': {
              bgcolor: viewMode === mode.key ? '#e2e8f0' : '#f8fafc',
            },
            ...(index > 0 && {
              borderLeft: '1px solid #e2e8f0',
            }),
          }}
        >
          {mode.icon}
        </IconButton>
      ))}
    </Box>
  );
};

export default ViewToggle;
