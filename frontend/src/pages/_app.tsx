import React from 'react';
import type { AppProps } from 'next/app';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import '@/styles/globals.css';

const theme = createTheme({
  palette: {
    mode: 'light',
    primary: {
      main: '#64748b',
    },
    background: {
      default: '#eef5fb', // 更偏藍一點點
      paper: '#eef5fb',   // paper 跟 default 一樣，讓右側 result 與輸入框同色
    },
  },
  typography: {
    fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
  },
  components: {
    MuiCssBaseline: {
      styleOverrides: {
        body: {
          margin: 0,
          padding: 0,
          overflow: 'hidden',
        },
        html: {
          margin: 0,
          padding: 0,
        },
        '#__next': {
          height: '100vh',
          width: '100vw',
        },
      },
    },
  },
});

export default function App({ Component, pageProps }: AppProps) {
  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <Component {...pageProps} />
    </ThemeProvider>
  );
}
