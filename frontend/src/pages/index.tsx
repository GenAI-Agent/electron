import React, { useState } from 'react';
import { Box, TextField, IconButton, Button } from '@mui/material';
import { ArrowForward, Email, FolderOpen } from '@mui/icons-material';
import { useRouter } from 'next/router';
import TitleBar from '@/components/TitleBar';
import LocalFileCards from '@/components/LocalFileCards';

const HomePage: React.FC = () => {
  const [url, setUrl] = useState('');
  const [isWebMode, setIsWebMode] = useState(true);
  const router = useRouter();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (url.trim()) {
      if (isWebMode) {
        router.push(`/browser?url=${encodeURIComponent(url)}`);
      } else {
        router.push(`/browser?path=${encodeURIComponent(url)}&mode=local`);
      }
    }
  };

  const handleModeChange = (webMode: boolean) => {
    setIsWebMode(webMode);
    setUrl(''); // 清空輸入框
  };

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
        title="Lens"
        showModeSwitch={true}
        isWebMode={isWebMode}
        onModeChange={handleModeChange}
      />

      {/* Main Content */}
      <Box
        sx={{
          flex: 1,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          gap: 4,
          p: 3,
        }}
      >
        {/* Conditional Content based on mode */}
        {isWebMode ? (
          <>
            {/* Gmail Auth Button - only in web mode */}
            <Button
              variant="contained"
              startIcon={<Email />}
              onClick={() => router.push('/gmail-auth')}
              sx={{
                bgcolor: '#4285f4',
                color: 'white',
                borderRadius: '25px',
                px: 4,
                py: 1.5,
                fontSize: '16px',
                textTransform: 'none',
                '&:hover': {
                  bgcolor: '#3367d6',
                },
              }}
            >
              Google OAuth 登入
            </Button>



            {/* URL Input */}
            <Box
              component="form"
              onSubmit={handleSubmit}
              sx={{
                display: 'flex',
                alignItems: 'center',
                width: '500px',
                maxWidth: '90vw',
              }}
            >
              <TextField
                fullWidth
                variant="outlined"
                placeholder="輸入網址..."
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                sx={{
                  '& .MuiOutlinedInput-root': {
                    borderRadius: '25px',
                    bgcolor: 'white',
                    '& fieldset': {
                      borderColor: '#e2e8f0',
                    },
                    '&:hover fieldset': {
                      borderColor: '#cbd5e1',
                    },
                    '&.Mui-focused fieldset': {
                      borderColor: '#64748b',
                    },
                  },
                }}
              />
              <IconButton
                type="submit"
                sx={{
                  ml: 1,
                  bgcolor: '#64748b',
                  color: 'white',
                  '&:hover': {
                    bgcolor: '#475569',
                  },
                }}
              >
                <ArrowForward />
              </IconButton>
            </Box>
          </>
        ) : (
          <>
            {/* File Path Input */}
            <Box
              component="form"
              onSubmit={handleSubmit}
              sx={{
                display: 'flex',
                alignItems: 'center',
                width: '500px',
                maxWidth: '90vw',
              }}
            >
              <TextField
                fullWidth
                variant="outlined"
                placeholder="輸入檔案路徑..."
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                sx={{
                  '& .MuiOutlinedInput-root': {
                    borderRadius: '25px',
                    bgcolor: 'white',
                    '& fieldset': {
                      borderColor: '#e2e8f0',
                    },
                    '&:hover fieldset': {
                      borderColor: '#cbd5e1',
                    },
                    '&.Mui-focused fieldset': {
                      borderColor: '#64748b',
                    },
                  },
                }}
              />
              <IconButton
                type="submit"
                sx={{
                  ml: 1,
                  bgcolor: '#64748b',
                  color: 'white',
                  '&:hover': {
                    bgcolor: '#475569',
                  },
                }}
              >
                <FolderOpen />
              </IconButton>
            </Box>

            {/* Local File Cards */}
            <LocalFileCards />
          </>
        )}
      </Box>
    </Box>
  );
};

export default HomePage;
