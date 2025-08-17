import React, { useState } from 'react';
import { Box, TextField, IconButton } from '@mui/material';
import { AttachFile, Image, Headset } from '@mui/icons-material';

interface InputAreaProps {
  onSubmit?: (text: string) => void;
  maxContentWidth?: number | string; // e.g., 960 or '50vw'
}

const InputArea: React.FC<InputAreaProps> = ({ onSubmit, maxContentWidth = '50vw' }) => {
  const [input, setInput] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim()) return;
    onSubmit?.(input);
    setInput('');
  };

  return (
    <Box sx={{
      display: 'flex', flexDirection: 'column', minHeight: 0,
      bgcolor: (t) => t.palette.background.default,
      px: 1.5, pt: 1, pb: 1,
    }}>
      <Box
        component="form"
        onSubmit={handleSubmit}
        sx={{
          flex: 1,
          display: 'flex', flexDirection: 'column', minHeight: 0,
          maxWidth: typeof maxContentWidth === 'number' ? `${maxContentWidth}px` : maxContentWidth,
          mx: 'auto', width: '100%',
        }}
      >
        <TextField
          fullWidth
          multiline
          placeholder="輸入文字"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          sx={{
            flex: 1,
            '& .MuiOutlinedInput-root': {
              bgcolor: (t) => t.palette.background.default,
              borderRadius: '10px',
              height: '100%',
              alignItems: 'flex-start',
              '& fieldset': { borderColor: '#e2e8f0' },
              '&:hover fieldset': { borderColor: '#cbd5e1' },
              '&.Mui-focused fieldset': { borderColor: '#94a3b8' },
            },
            '& .MuiOutlinedInput-inputMultiline': {
              paddingTop: '8px',
              paddingLeft: '6px',
              paddingRight: '8px',
              paddingBottom: '6px',
              margin: 0,
              fontSize: '14px',
              lineHeight: 1.4,
              textAlign: 'left',
              color: '#1a202c',
              '&::placeholder': { color: '#94a3b8', opacity: 1 },
            },
          }}
        />
      </Box>

      <Box sx={{
        display: 'flex', justifyContent: 'space-between', alignItems: 'center', pt: '6px', flexShrink: 0,
        maxWidth: typeof maxContentWidth === 'number' ? `${maxContentWidth}px` : maxContentWidth,
        mx: 'auto', width: '100%',
      }}>
        <Box sx={{ display: 'flex', gap: '6px' }}>
          <IconButton size="small" sx={{ color: '#64748b', '&:hover': { bgcolor: '#f1f5f9' }, width: 22, height: 22 }}>
            <AttachFile sx={{ fontSize: 16 }} />
          </IconButton>
          <IconButton size="small" sx={{ color: '#64748b', '&:hover': { bgcolor: '#f1f5f9' }, width: 22, height: 22 }}>
            <Image sx={{ fontSize: 16 }} />
          </IconButton>
          <IconButton size="small" sx={{ color: '#64748b', '&:hover': { bgcolor: '#f1f5f9' }, width: 22, height: 22 }}>
            <Headset sx={{ fontSize: 16 }} />
          </IconButton>
        </Box>
        <Box />
      </Box>
    </Box>
  );
};

export default InputArea;

