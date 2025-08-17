import React, { useState, useEffect } from 'react';
import { Box, IconButton, Switch, FormControlLabel, TextField, InputAdornment } from '@mui/material';
import { Home, Language, Folder, Search } from '@mui/icons-material';
import { useRouter } from 'next/router';

interface TitleBarProps {
  title?: string;
  showModeSwitch?: boolean;
  isWebMode?: boolean;
  onModeChange?: (isWebMode: boolean) => void;
  showHomeButton?: boolean;
  showUrlInput?: boolean;
  onUrlChange?: (url: string) => void;
}

const TitleBar: React.FC<TitleBarProps> = ({
  title = 'Lens',
  showModeSwitch = false,
  isWebMode = true,
  onModeChange,
  showHomeButton = false,
  showUrlInput = false,
  onUrlChange,
}) => {
  const router = useRouter();
  const [urlInput, setUrlInput] = useState('');
  const [isEditing, setIsEditing] = useState(false);

  useEffect(() => {
    if (title && title !== 'Lens' && !isEditing) {
      setUrlInput(title);
    }
  }, [title, isEditing]);

  const handleHomeClick = () => {
    router.push('/');
  };

  const handleUrlSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (urlInput.trim() && onUrlChange) {
      onUrlChange(urlInput.trim());
      setIsEditing(false);
    }
  };

  const handleUrlInputClick = () => {
    console.log('URL input clicked, showUrlInput:', showUrlInput);
    if (showUrlInput) {
      setIsEditing(true);
    }
  };

  return (
    <Box
      className="title-bar"
      sx={{
        height: '32px', // 減少高度從 40px 到 32px
        bgcolor: '#374151',
        display: 'flex',
        alignItems: 'center',
        paddingLeft: '12px',
        paddingRight: '12px',
        WebkitAppRegion: 'drag',
        position: 'relative',
        zIndex: 1000,
        borderBottom: '1px solid #4b5563', // 添加底部邊框
      }}
    >
      {/* Traffic Lights */}
      <Box
        sx={{
          display: 'flex',
          alignItems: 'center',
          gap: '6px',
          WebkitAppRegion: 'no-drag',
        }}
      >
        {/* Close button - Red */}
        <Box
          sx={{
            width: '12px',
            height: '12px',
            borderRadius: '50%',
            bgcolor: '#ef4444',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '8px',
            color: 'transparent',
            '&:hover': {
              bgcolor: '#dc2626',
              color: 'white',
            },
          }}
          onClick={() => {
            if (window.electronAPI?.closeWindow) {
              window.electronAPI.closeWindow();
            }
          }}
        >
          ×
        </Box>

        {/* Minimize button - Yellow */}
        <Box
          sx={{
            width: '12px',
            height: '12px',
            borderRadius: '50%',
            bgcolor: '#f59e0b',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '8px',
            color: 'transparent',
            '&:hover': {
              bgcolor: '#d97706',
              color: 'white',
            },
          }}
          onClick={() => {
            if (window.electronAPI?.minimizeWindow) {
              window.electronAPI.minimizeWindow();
            }
          }}
        >
          −
        </Box>

        {/* Maximize button - Green */}
        <Box
          sx={{
            width: '12px',
            height: '12px',
            borderRadius: '50%',
            bgcolor: '#10b981',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '8px',
            color: 'transparent',
            '&:hover': {
              bgcolor: '#059669',
              color: 'white',
            },
          }}
          onClick={() => {
            if (window.electronAPI?.maximizeWindow) {
              window.electronAPI.maximizeWindow();
            }
          }}
        >
          □
        </Box>

        {/* Home button - Blue (new) */}
        {showHomeButton && (
          <Box
            sx={{
              width: '12px',
              height: '12px',
              borderRadius: '50%',
              bgcolor: '#3b82f6',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '8px',
              color: 'transparent',
              '&:hover': {
                bgcolor: '#2563eb',
                color: 'white',
              },
            }}
            onClick={handleHomeClick}
          >
            ⌂
          </Box>
        )}
      </Box>

      {/* Mode Switch */}
      {showModeSwitch && (
        <Box
          sx={{
            ml: 2,
            WebkitAppRegion: 'no-drag',
          }}
        >
          <FormControlLabel
            control={
              <Switch
                checked={isWebMode}
                onChange={(e) => onModeChange?.(e.target.checked)}
                size="small"
                sx={{
                  '& .MuiSwitch-switchBase.Mui-checked': {
                    color: '#3b82f6',
                  },
                  '& .MuiSwitch-switchBase.Mui-checked + .MuiSwitch-track': {
                    backgroundColor: '#3b82f6',
                  },
                }}
              />
            }
            label={
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                {isWebMode ? <Language sx={{ fontSize: 12 }} /> : <Folder sx={{ fontSize: 12 }} />}
                <Box sx={{ fontSize: '10px', color: '#d1d5db' }}>
                  {isWebMode ? 'Web' : 'Local'}
                </Box>
              </Box>
            }
            sx={{
              margin: 0,
              '& .MuiFormControlLabel-label': {
                fontSize: '10px',
                color: '#d1d5db',
              },
            }}
          />
        </Box>
      )}

      {/* Title Display / URL Input - 絕對置中，佔頁面寬度的一半 */}
      <Box
        sx={{
          position: 'absolute',
          left: '25%',
          width: '50%',
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          WebkitAppRegion: 'no-drag', // 改為 no-drag 以允許點擊事件
          pointerEvents: 'auto', // 改為 auto 以允許點擊事件
        }}
      >
        {showUrlInput && isEditing ? (
          <Box
            component="form"
            onSubmit={handleUrlSubmit}
            sx={{
              width: '100%', // 改為 100% 寬度
              pointerEvents: 'auto',
              WebkitAppRegion: 'no-drag',
            }}
          >
            <TextField
              value={urlInput}
              onChange={(e) => setUrlInput(e.target.value)}
              onBlur={() => setIsEditing(false)}
              autoFocus
              size="small"
              placeholder="輸入網址..."
              sx={{
                width: '100%',
                '& .MuiOutlinedInput-root': {
                  height: '20px',
                  bgcolor: '#4b5563',
                  borderRadius: '10px',
                  fontSize: '10px',
                  color: '#d1d5db',
                  '& fieldset': { borderColor: '#6b7280' },
                  '&:hover fieldset': { borderColor: '#9ca3af' },
                  '&.Mui-focused fieldset': { borderColor: '#3b82f6' },
                },
                '& .MuiOutlinedInput-input': {
                  padding: '2px 8px',
                  fontSize: '10px',
                  color: '#d1d5db',
                  '&::placeholder': { color: '#9ca3af', opacity: 1 },
                },
              }}
              slotProps={{
                input: {
                  endAdornment: (
                    <InputAdornment position="end">
                      <IconButton
                        type="submit"
                        size="small"
                        sx={{
                          color: '#9ca3af',
                          padding: '2px',
                          '&:hover': { color: '#d1d5db' },
                        }}
                      >
                        <Search sx={{ fontSize: 12 }} />
                      </IconButton>
                    </InputAdornment>
                  ),
                },
              }}
            />
          </Box>
        ) : (
          <Box
            onClick={handleUrlInputClick}
            onMouseDown={(e) => {
              console.log('Mouse down on URL area');
              e.stopPropagation();
            }}
            sx={{
              height: '16px', // 減少高度從 18px 到 16px
              bgcolor: '#4b5563',
              borderRadius: '8px', // 減少圓角從 9px 到 8px
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#d1d5db',
              fontSize: '10px', // 減少字體從 11px 到 10px
              fontWeight: 400,
              px: 1.2, // 減少內邊距從 1.5 到 1.2
              minWidth: '200px', // 增加最小寬度
              width: '100%', // 設置為 100% 寬度，佔滿一半頁面寬
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap',
              pointerEvents: 'auto',
              WebkitAppRegion: 'no-drag', // 確保不被拖拽干擾
              cursor: showUrlInput ? 'pointer' : 'default',
              border: showUrlInput ? '1px solid transparent' : 'none',
              '&:hover': showUrlInput ? {
                bgcolor: '#6b7280',
                border: '1px solid #9ca3af',
              } : {},
            }}
          >
            {title}
          </Box>
        )}
      </Box>
    </Box>
  );
};

export default TitleBar;
