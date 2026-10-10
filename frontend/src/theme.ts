import { extendTheme, type ThemeConfig } from '@chakra-ui/react';

const config: ThemeConfig = { initialColorMode: 'light', useSystemColorMode: false };

// "Drafting table" palette: cool paper, navy ink, yellow highlighter.
export const theme = extendTheme({
  config,
  fonts: {
    heading: "'Bricolage Grotesque', system-ui, sans-serif",
    body: "'Instrument Sans', system-ui, sans-serif",
  },
  colors: {
    paper: '#F4F7FB',
    ink: '#0E2238',
    blueprint: '#123A6B',
    sky: {
      50: '#EAF1FF', 100: '#D3E2FF', 200: '#A8C4FF', 300: '#7BA3FF', 400: '#4F85FA',
      500: '#2B6CF6', 600: '#1F55CC', 700: '#1A44A3', 800: '#143479', 900: '#0E2350',
    },
    marker: '#FFD84D',
    rule: '#D5DEEA',
    muted: '#4A5E75',
  },
  styles: {
    global: {
      'html, body': {
        bg: 'paper',
        color: 'ink',
        // Graph paper, very subtle
        backgroundImage:
          'linear-gradient(rgba(14,34,56,0.045) 1px, transparent 1px), linear-gradient(90deg, rgba(14,34,56,0.045) 1px, transparent 1px)',
        backgroundSize: '32px 32px',
        lineHeight: 1.6,
      },
      '::selection': { background: '#FFD84D', color: '#0E2238' },
    },
  },
  components: {
    Heading: { baseStyle: { letterSpacing: '-0.02em', lineHeight: 1.1 } },
  },
});
