import React from 'react';
import { Box } from '@mui/material';
import GoogleAuth from '../components/GoogleAuth';
import TitleBar from '../components/TitleBar';

const GmailAuthPage: React.FC = () => {
  return (
    <Box
      sx={{
        height: '100vh',
        width: '100vw',
        display: 'flex',
        flexDirection: 'column',
        bgcolor: '#f0f4f8',
        margin: 0,
        padding: 0,
      }}
    >
      {/* Title Bar */}
      <TitleBar
        title="Google OAuth 登入"
        showHomeButton={true}
      />

      {/* Main Content */}
      <Box
        sx={{
          flex: 1,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          p: 2,
        }}
      >
        <GoogleAuth />
      </Box>
    </Box>
  );
};

export default GmailAuthPage;
