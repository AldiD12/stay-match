import type { Config } from 'tailwindcss';

const config: Config = {
  content: [
    './app/**/*.{ts,tsx}',
    './components/**/*.{ts,tsx}',
  ],
  theme: {
    extend: {
      colors: {
        "surface-bright": "#faf9f6",
        "inverse-surface": "#2f312f",
        "on-tertiary-fixed-variant": "#484645",
        "on-surface": "#1a1c1a",
        "on-secondary-fixed-variant": "#50453a",
        "surface-variant": "#e3e2e0",
        "on-tertiary-fixed": "#1c1b1a",
        "tertiary-fixed": "#e6e2df",
        "background": "#faf9f6",
        "on-primary-fixed-variant": "#474746",
        "surface-container-lowest": "#ffffff",
        "on-background": "#1a1c1a",
        "secondary-container": "#f1dfd1",
        "inverse-primary": "#c8c6c5",
        "inverse-on-surface": "#f2f1ee",
        "surface-container-low": "#f4f3f1",
        "error-container": "#ffdad6",
        "error": "#ba1a1a",
        "surface": "#faf9f6",
        "surface-container-highest": "#e3e2e0",
        "outline-variant": "#c4c7c7",
        "primary-fixed": "#e5e2e1",
        "on-secondary": "#ffffff",
        "on-surface-variant": "#444748",
        "on-tertiary": "#ffffff",
        "primary": "#000000",
        "surface-container-high": "#e9e8e5",
        "surface-dim": "#dbdad7",
        "tertiary": "#000000",
        "tertiary-container": "#1c1b1a",
        "on-error": "#ffffff",
        "on-error-container": "#93000a",
        "secondary-fixed-dim": "#d4c4b6",
        "primary-container": "#1c1b1b",
        "outline": "#747878",
        "on-secondary-container": "#6f6257",
        "on-primary-fixed": "#1c1b1b",
        "secondary": "#695c51",
        "on-primary-container": "#858383",
        "on-secondary-fixed": "#231a11",
        "surface-tint": "#5f5e5e",
        "surface-container": "#efeeeb",
        "on-tertiary-container": "#868382",
        "tertiary-fixed-dim": "#cac6c4",
        "on-primary": "#ffffff",
        "primary-fixed-dim": "#c8c6c5",
        "secondary-fixed": "#f1dfd1"
      },
      borderRadius: {
        "DEFAULT": "1rem",
        "lg": "2rem",
        "xl": "3rem",
        "full": "9999px"
      },
      spacing: {
        "unit": "8px",
        "margin-mobile": "20px",
        "stack-sm": "16px",
        "margin-desktop": "64px",
        "container-max": "1280px",
        "gutter": "24px",
        "stack-md": "32px",
        "stack-lg": "64px"
      },
      fontFamily: {
        "headline-md": ["Plus Jakarta Sans", "sans-serif"],
        "headline-lg": ["Plus Jakarta Sans", "sans-serif"],
        "body-md": ["Plus Jakarta Sans", "sans-serif"],
        "body-lg": ["Plus Jakarta Sans", "sans-serif"],
        "display-lg": ["Plus Jakarta Sans", "sans-serif"],
        "label-lg": ["Plus Jakarta Sans", "sans-serif"],
        "label-sm": ["Plus Jakarta Sans", "sans-serif"],
        "headline-lg-mobile": ["Plus Jakarta Sans", "sans-serif"],
        "serif": ["Playfair Display", "serif"]
      },
      fontSize: {
        "headline-md": [
          "24px",
          {
            lineHeight: "32px",
            fontWeight: "600"
          }
        ],
        "headline-lg": [
          "32px",
          {
            lineHeight: "40px",
            letterSpacing: "-0.01em",
            fontWeight: "700"
          }
        ],
        "body-md": [
          "16px",
          {
            lineHeight: "24px",
            fontWeight: "400"
          }
        ],
        "body-lg": [
          "18px",
          {
            lineHeight: "28px",
            fontWeight: "400"
          }
        ],
        "display-lg": [
          "48px",
          {
            lineHeight: "56px",
            letterSpacing: "-0.02em",
            fontWeight: "700"
          }
        ],
        "label-lg": [
          "14px",
          {
            lineHeight: "20px",
            letterSpacing: "0.02em",
            fontWeight: "600"
          }
        ],
        "label-sm": [
          "12px",
          {
            lineHeight: "16px",
            letterSpacing: "0.05em",
            fontWeight: "700"
          }
        ],
        "headline-lg-mobile": [
          "28px",
          {
            lineHeight: "36px",
            fontWeight: "700"
          }
        ]
      },
      animation: {
        'pulse-slow': 'pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite',
      },
    },
  },
  plugins: [],
};

export default config;

