import typography from '@tailwindcss/typography';

/** @type {import('tailwindcss').Config} */
export default {
  content: ["./src/**/*.{astro,html,js,jsx,md,mdx,svelte,ts,tsx,vue}"],
  safelist: [
    // IconLink color variants
    'bg-primary-100', 'bg-primary-200', 'ring-primary-300', 'hover:bg-primary-200', 'hover:ring-primary', 'text-primary', 'group-hover:text-primary-content',
    'bg-secondary-100', 'bg-secondary-200', 'ring-secondary-300', 'hover:bg-secondary-200', 'hover:ring-secondary', 'text-secondary', 'group-hover:text-secondary-content',
    'bg-neutral-100', 'bg-neutral-200', 'ring-neutral-300', 'hover:bg-neutral-200', 'hover:ring-neutral', 'text-neutral', 'group-hover:text-neutral-content',

    // CustomLink color variants
    'bg-base-100', 'bg-base-200', 'ring-base-300', 'hover:bg-base-200', 'hover:ring-base-content/20', 'text-base-content', 'text-base-content/60', 'text-base-content/70',
    'hover:ring-primary-content/20', 'text-primary-content', 'text-primary-content/60', 'text-primary-content/70',
    'hover:ring-secondary-content/20', 'text-secondary-content', 'text-secondary-content/60', 'text-secondary-content/70',
    'hover:ring-neutral-content/20', 'text-neutral-content', 'text-neutral-content/60', 'text-neutral-content/70',
  ],
  future: {
    hoverOnlyWhenSupported: true,
  },
  theme: {
    extend: {
      typography: {
        DEFAULT: {
          css: {
            fontFamily: 'inherit',
            maxWidth: '65ch',
            h1: {
              fontWeight: '300',
              fontSize: '2.25em',
              marginTop: '2.1em',
              marginBottom: '0.75em',
              lineHeight: 1.1,
              color: 'var(--accent-200)',
            },
            p: {
              fontFamily: 'ui-serif, Georgia, Cambria, "Times New Roman", Times, serif',
              fontSize: '1.2em',
              lineHeight: 1.6
            },
            ul: {
              fontFamily: 'ui-serif, Georgia, Cambria, "Times New Roman", Times, serif',
              fontSize: '1.2em',
              lineHeight: 1.6
            },
            ol: {
              fontFamily: 'ui-serif, Georgia, Cambria, "Times New Roman", Times, serif',
              fontSize: '1.2em',
              lineHeight: 1.6
            },
            figcaption: {
              fontSize: '1.1em',
            }
          },
        },
      },
      colors: {
          "primary-100": "oklch(from var(--primary-100) l c h / <alpha-value>)",
          "primary-200": "oklch(from var(--primary-200) l c h / <alpha-value>)",
          "primary-300": "oklch(from var(--primary-300) l c h / <alpha-value>)",
          "primary-content": "oklch(from var(--primary-content) l c h / <alpha-value>)",

          "secondary-100": "oklch(from var(--secondary-100) l c h / <alpha-value>)",
          "secondary-200": "oklch(from var(--secondary-200) l c h / <alpha-value>)",
          "secondary-300": "oklch(from var(--secondary-300) l c h / <alpha-value>)",
          "secondary-content": "oklch(from var(--secondary-content) l c h / <alpha-value>)",



          "neutral-100": "oklch(from var(--neutral-100) l c h / <alpha-value>)",
          "neutral-200": "oklch(from var(--neutral-200) l c h / <alpha-value>)",
          "neutral-300": "oklch(from var(--neutral-300) l c h / <alpha-value>)",
          "neutral-content": "oklch(from var(--neutral-content) l c h / <alpha-value>)",

          "base-100": "oklch(from var(--base-100) l c h / <alpha-value>)",
          "base-200": "oklch(from var(--base-200) l c h / <alpha-value>)",
          "base-300": "oklch(from var(--base-300) l c h / <alpha-value>)",
          "base-content": "oklch(from var(--base-content) l c h / <alpha-value>)",

          "bg-top": "oklch(from var(--bg-top) l c h / <alpha-value>)",
          "bg-bottom": "oklch(from var(--bg-bottom) l c h / <alpha-value>)",
      }
    }
  },
  plugins: [typography],
};
