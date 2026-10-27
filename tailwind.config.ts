import type { Config } from 'tailwindcss'

export default {
  content: [
    './index.html',
    './src/**/*.{ts,tsx}',
  ],
  theme: {
    extend: {
      // "Schermo intero" = area realmente visibile. Su iPad/iPhone 100vh è
      // l'altezza con le barre del browser NASCOSTE, quindi la pagina risulta
      // più alta di ciò che si vede e la barra in basso finisce fuori schermo.
      // 100dvh segue le barre; il valore 100vh resta come ripiego per i
      // browser che non conoscono dvh.
      minHeight: { screen: ['100vh', '100dvh'] },
      height:    { screen: ['100vh', '100dvh'] },
      colors: {
        'roamly-g0':   '#0C2A3D',
        'roamly-g1':   '#123F58',
        'roamly-g2':   '#154B63',
        'roamly-g3':   '#0B6F99',
        'roamly-g4':   '#5FB8D9',
        'roamly-g5':   '#A3DAEC',
        'roamly-g6':   '#DFF3FA',
        'roamly-g7':   '#F0FAFD',
        'roamly-bg':   '#F9FBFC',
        'roamly-text': '#16232E',

        // Inchiostri pieni per il testo (al posto di text-roamly-text/NN):
        // contrasto AA garantito su bianco e su roamly-bg.
        'roamly-ink':      '#2B3C49',  // etichette, corpo
        'roamly-ink-soft': '#3D5262',  // descrizioni
        'roamly-muted':    '#5A7183',  // secondario, placeholder, meta

        // Accento firma — usato con parsimonia sui punti che
        // devono restare impressi: CTA principali, bottone "+",
        // momenti speciali. Non sostituisce il blu, lo completa.
        'roamly-coral':       '#FF6B4A',
        'roamly-coral-dark':  '#E5563A',
        'roamly-coral-light': '#FFE4DC',
      },
      fontFamily: {
        'lora':    ['Lora', 'Georgia', 'serif'],
        'dm-sans': ['DM Sans', 'system-ui', 'sans-serif'],
        'dm-mono': ['DM Mono', 'Courier New', 'monospace'],
      },
      fontSize: {
        'display': ['2rem',    { lineHeight: '1.2',  fontWeight: '600' }],  // 32px — hero, copertina Racconto
        'h1':      ['1.5rem',  { lineHeight: '1.3',  fontWeight: '600' }],  // 24px — titoli pagina
        'h2':      ['1.125rem',{ lineHeight: '1.4',  fontWeight: '600' }],  // 18px — sezioni
        'caption': ['0.8125rem',{ lineHeight: '1.4', fontWeight: '500' }],  // 13px — meta/caption
      },
      maxWidth: {
        'mobile': '430px',
      },
      borderRadius: {
        '2xl': '1rem',
        '3xl': '1.5rem',
      },
      boxShadow: {
        'roamly':    '0 2px 12px -2px rgba(12, 42, 61, 0.08), 0 1px 3px -1px rgba(12, 42, 61, 0.06)',
        'roamly-lg': '0 8px 30px -4px rgba(12, 42, 61, 0.14), 0 2px 8px -2px rgba(12, 42, 61, 0.08)',
        'roamly-coral': '0 8px 24px -6px rgba(229, 86, 58, 0.5)',
      },
    },
  },
  plugins: [],
} satisfies Config
