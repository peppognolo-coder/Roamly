// ============================================================
// MoodIcon — icone mood Roamly (direzione 1b: tondo pieno, tinta
// per mood). Sostituisce le emoji di sistema di MOOD_OPTIONS, che
// cambiano da telefono a telefono.
//
// Griglia 48. Tratto in blu notte (#0C2A3D), accenti corallo
// (#E5563A) solo dove c'è emozione: cuori, stelle, guance. Il
// disegno è fedele a "Roamly Mood Icons" (design) e vive qui come
// stringhe SVG statiche: nessun input utente entra nel markup.
//
// Contiene già i 20 mood del set completo (10 attuali + 10 nuovi
// del design); l'UI ne espone solo quelli presenti in Mood/
// MOOD_OPTIONS. Inline SVG → html-to-image lo esporta nelle share
// card senza fetch/CORS.
// ============================================================

const G0   = '#0C2A3D'
const CO   = '#E5563A'
const DROP = '#0B6F99'

const ln = (d: string, S: string, w = 2.4) =>
  `<path d="${d}" stroke="${S}" stroke-width="${w}" fill="none" stroke-linecap="round" stroke-linejoin="round"/>`
const dot = (x: number, y: number, r: number, F: string) =>
  `<circle cx="${x}" cy="${y}" r="${r}" fill="${F}"/>`
const sparkle = (x: number, y: number, r: number, F: string) =>
  `<path d="M${x} ${y - r}L${x + r * 0.28} ${y - r * 0.28}L${x + r} ${y}L${x + r * 0.28} ${y + r * 0.28}L${x} ${y + r}L${x - r * 0.28} ${y + r * 0.28}L${x - r} ${y}L${x - r * 0.28} ${y - r * 0.28}Z" fill="${F}"/>`
const heart = (x: number, y: number, s: number, F: string) =>
  `<path transform="translate(${x} ${y}) scale(${s})" d="M0 3.2C-2.6 1.4-4 0-4-1.6-4-3 -2.9-4-1.8-4-1-4-.4-3.6 0-3c.4-.6 1-1 1.8-1C2.9-4 4-3 4-1.6 4 0 2.6 1.4 0 3.2Z" fill="${F}"/>`

const S = G0
const A = CO

const FACCE: Record<string, string> = {
  felice:       dot(17, 20, 2.3, S) + dot(31, 20, 2.3, S) + ln('M16 28Q24 35.5 32 28', S),
  meravigliato: heart(17, 21, 1.15, A) + heart(31, 21, 1.15, A) + `<path d="M17 28.5Q24 37 31 28.5Z" fill="${S}"/>`,
  sereno:       ln('M13.5 21Q17 24 20.5 21', S) + ln('M27.5 21Q31 24 34.5 21', S) + ln('M18.5 29.5Q24 32.5 29.5 29.5', S),
  entusiasta:   ln('M13.5 22Q17 17.5 20.5 22', S) + ln('M27.5 22Q31 17.5 34.5 22', S) + `<path d="M15 27H33Q33 36.5 24 36.5Q15 36.5 15 27Z" fill="${A}"/>`,
  ispirato:     sparkle(17, 21, 5, A) + sparkle(31, 21, 5, A) + ln('M18 30Q24 34 30 30', S),
  grato:        ln('M13.5 21.5Q17 24.5 20.5 21.5', S) + ln('M27.5 21.5Q31 24.5 34.5 21.5', S) + dot(13.5, 28, 2.6, A) + dot(34.5, 28, 2.6, A) + ln('M20 30Q24 32.5 28 30', S),
  nostalgico:   dot(17, 21, 2.3, S) + dot(31, 21, 2.3, S) + ln('M13.5 15.5L19.5 14', S, 2) + ln('M34.5 15.5L28.5 14', S, 2) + `<path d="M32.5 25.5Q34.5 28.5 32.5 30Q30.5 28.5 32.5 25.5Z" fill="${DROP}"/>` + ln('M18.5 32Q21.5 30 24 32Q26.5 34 29.5 32', S),
  sorpreso:     dot(17, 20, 3, S) + dot(31, 20, 3, S) + ln('M13.5 13.5Q17 11.5 20.5 13.5', S, 2) + ln('M27.5 13.5Q31 11.5 34.5 13.5', S, 2) + `<ellipse cx="24" cy="31" rx="3.4" ry="4.2" fill="${S}"/>`,
  stanco:       ln('M13.5 22H20.5', S) + ln('M27.5 22H34.5', S) + ln('M14.5 22Q17 25 20 22', S, 1.6) + ln('M28 22Q31 25 33.5 22', S, 1.6) + ln('M20.5 31H27.5', S) + ln('M38 3.5H45L38 10.5H45', A, 2),
  divertito:    dot(17, 20, 2.3, S) + ln('M27.5 20.5Q31 17.5 34.5 20.5', S) + `<path d="M20 29.5H28V34.5Q28 39 24 39Q20 39 20 34.5Z" fill="${A}"/>` + ln('M24 31V35.5', '#B2432C', 1.6) + ln('M15 26Q24 34.5 33 26', S),
  // ---- nuovi del set completo (non ancora in Mood/MOOD_OPTIONS) ----
  innamorato:   ln('M13.5 21Q17 24 20.5 21', S) + ln('M27.5 21Q31 24 34.5 21', S) + ln('M17 28.5Q24 34.5 31 28.5', S) + dot(13.5, 27.5, 2.4, A) + dot(34.5, 27.5, 2.4, A) + heart(39, 9, 1.35, A),
  orgoglioso:   ln('M13.5 20.5H20.5', S) + ln('M27.5 20.5H34.5', S) + ln('M14 16.5Q17 14.5 20 16', S, 2) + ln('M28 16Q31 14.5 34 16.5', S, 2) + ln('M18 30Q25 33.5 31.5 27.5', S) + sparkle(40, 8, 4, A),
  curioso:      dot(17, 21, 2.3, S) + dot(31, 21, 3, S) + ln('M13.5 16.5L20 16', S, 2) + ln('M27.5 13.5Q31 11 34.5 13.5', S, 2) + ln('M21 31.5Q24.5 30 28 31.5', S) + `<circle cx="40" cy="9" r="3.6" fill="none" stroke="${A}" stroke-width="2"/>` + ln('M42.6 11.6L45 14', A, 2),
  avventuroso:  dot(17, 21.5, 2.3, S) + dot(31, 21.5, 2.3, S) + ln('M13.5 16.5L20.5 18', S, 2.2) + ln('M34.5 16.5L27.5 18', S, 2.2) + `<path d="M16.5 28H31.5Q30 34.5 24 34.5Q18 34.5 16.5 28Z" fill="${S}"/>` + ln('M38 2.5V13', S, 2) + `<path d="M38 2.5L45 5L38 7.5Z" fill="${A}"/>`,
  commosso:     ln('M13.5 21Q17 24 20.5 21', S) + ln('M27.5 21Q31 24 34.5 21', S) + `<path d="M15.5 25Q17.5 28 15.5 29.5Q13.5 28 15.5 25Z" fill="${DROP}"/>` + `<path d="M32.5 25Q34.5 28 32.5 29.5Q30.5 28 32.5 25Z" fill="${DROP}"/>` + ln('M19 31Q24 34 29 31', S),
  spensierato:  ln('M13.5 22Q17 18 20.5 22', S) + ln('M27.5 22Q31 18 34.5 22', S) + `<circle cx="26" cy="31" r="2.4" fill="none" stroke="${S}" stroke-width="2.2"/>` + dot(37.5, 12, 2.3, A) + ln('M39.6 12V3.5L44 5', A, 2),
  affamato:     dot(18.5, 19, 2.3, S) + dot(32.5, 19, 2.3, S) + ln('M16 28Q24 34 32 28', S) + `<path d="M31 29.5Q33 33 31.2 35Q29.4 33 31 29.5Z" fill="${DROP}"/>` + ln('M10 9V14M12.5 9V14M10 14Q11.25 15.5 12.5 14M11.25 15V19', A, 1.6),
  confuso:      dot(17, 20, 2.3, S) + dot(31, 22, 2.3, S) + ln('M18 31L21 29L24 31L27 29L30 31', S, 2.2) + ln('M37 5.5Q38.5 2.5 41.5 3Q44.5 4 43.5 7Q42.5 9 40.5 9.5V11.5', A, 2) + dot(40.5, 14.5, 1.3, A),
  ansioso:      dot(17, 21, 2.7, S) + dot(31, 21, 2.7, S) + ln('M13.5 16.5L20 15', S, 2) + ln('M34.5 16.5L28 15', S, 2) + ln('M18.5 31.5Q21 29.5 24 31.5Q27 33.5 29.5 31.5', S) + `<path d="M40 5Q43 9.5 40 11.5Q37 9.5 40 5Z" fill="${DROP}"/>`,
  frustrato:    dot(17, 21.5, 2.3, S) + dot(31, 21.5, 2.3, S) + ln('M13.5 15L20.5 18', S, 2.2) + ln('M34.5 15L27.5 18', S, 2.2) + ln('M18 32.5Q24 27.5 30 32.5', S) + ln('M37 6.5Q40 5 40.5 8M44 9.5Q42 12.5 39.5 11.5', A, 2),
}

// Tinte per mood (set completo, palette del repo: gialli, azzurri, corallo chiaro)
export const MOOD_TINTE: Record<string, string> = {
  felice: '#FDE68A', entusiasta: '#FFC9A8', divertito: '#FEF3C7', innamorato: '#FFD3C7', orgoglioso: '#FDE68A',
  meravigliato: '#FFD3C7', ispirato: '#A3DAEC', sorpreso: '#FEF3C7', curioso: '#C9E4F0', avventuroso: '#FFB59F',
  sereno: '#DFF3FA', grato: '#FFE4DC', commosso: '#C9E4F0', spensierato: '#DFF3FA', nostalgico: '#D6E3EC',
  stanco: '#E3EAEF', affamato: '#FFE4DC', confuso: '#E3EAEF', ansioso: '#D6E3EC', frustrato: '#FFD3C7',
}

interface MoodIconProps {
  mood:       string
  size?:      number
  className?: string
  title?:     string
}

export function MoodIcon({ mood, size = 24, className, title }: MoodIconProps) {
  const chiave = FACCE[mood] ? mood : 'sereno'
  const inner =
    `<circle cx="24" cy="24" r="21" fill="${MOOD_TINTE[chiave]}"/>` + FACCE[chiave]

  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 48 48"
      className={className}
      style={{ flex: 'none', display: 'block' }}
      role={title ? 'img' : undefined}
      aria-label={title}
      aria-hidden={title ? undefined : true}
      dangerouslySetInnerHTML={{ __html: inner }}
    />
  )
}
