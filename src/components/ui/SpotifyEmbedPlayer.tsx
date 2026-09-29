// ============================================================
// ROAMLY — SpotifyEmbedPlayer
// Player ufficiale Spotify (iframe oEmbed) per il brano collegato
// al ricordo — anteprima di 30s riproducibile da chiunque, senza
// login né Premium. Nessuna dipendenza aggiuntiva: è lo stesso
// widget che Spotify genera per i link condivisi.
// ============================================================

interface SpotifyEmbedPlayerProps {
  trackId: string
}

export function SpotifyEmbedPlayer({ trackId }: SpotifyEmbedPlayerProps) {
  return (
    <div className="rounded-2xl overflow-hidden shadow-roamly">
      <iframe
        title="Colonna sonora del ricordo"
        src={`https://open.spotify.com/embed/track/${trackId}?theme=0`}
        width="100%"
        height="152"
        style={{ border: 0, display: 'block' }}
        allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture"
        loading="lazy"
      />
    </div>
  )
}
