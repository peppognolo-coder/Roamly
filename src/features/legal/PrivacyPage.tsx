import { LegalLayout, Sezione, Elenco } from './LegalLayout'
import { EMAIL_PRIVACY, TITOLARE } from '@/lib/legal'

export function PrivacyPage() {
  return (
    <LegalLayout titolo="Privacy policy">
      <Sezione titolo="Chi siamo">
        <p>
          Roamly è un diario di viaggio per conservare e rivivere i tuoi viaggi. Titolare del
          trattamento dei dati: {TITOLARE}.
          {EMAIL_PRIVACY && <> Per qualsiasi richiesta sui tuoi dati: <a className="underline" href={`mailto:${EMAIL_PRIVACY}`}>{EMAIL_PRIVACY}</a>.</>}
        </p>
      </Sezione>

      <Sezione titolo="Quali dati raccogliamo">
        <p>Raccogliamo solo ciò che serve a far funzionare l'app:</p>
        <Elenco voci={[
          'Account: indirizzo email, nome, bio e foto profilo; se usi Google o Apple, i dati base che il servizio ci comunica (email e nome).',
          'Contenuti che crei: viaggi, ricordi, foto, note, tappe, prenotazioni, budget, checklist, luoghi salvati.',
          'Documenti del Wallet: i file che carichi (ad esempio carte d\'imbarco, biglietti, assicurazioni, documenti d\'identità) e le informazioni che scrivi per descriverli. Caricarli è una tua scelta.',
          'Dati di gruppo: i viaggi condivisi con altre persone e gli inviti.',
          'Dati tecnici: il token per le notifiche push (solo se le attivi) e la sessione di accesso.',
        ]} />
        <p>Non usiamo pubblicità, non vendiamo i tuoi dati e non facciamo tracciamento a fini commerciali.</p>
      </Sezione>

      <Sezione titolo="A cosa servono">
        <Elenco voci={[
          'Fornire l\'app: salvare, mostrare e sincronizzare i tuoi contenuti.',
          'Permettere la condivisione con le persone che inviti o con chi ha il link pubblico che crei.',
          'Inviarti le notifiche che scegli di ricevere (promemoria prenotazioni, attività del gruppo, ricordi di un anno fa).',
        ]} />
        <p>Base giuridica: l'esecuzione del servizio che hai richiesto e, per le notifiche, il tuo consenso.</p>
      </Sezione>

      <Sezione titolo="Con chi li condividiamo">
        <p>I dati sono trattati da fornitori che ci servono per far funzionare Roamly:</p>
        <Elenco voci={[
          'Supabase: database, autenticazione e archiviazione dei file.',
          'Netlify: hosting dell\'app.',
          'Google: accesso con Google (se lo scegli) e caratteri tipografici (Google Fonts).',
          'Apple: accesso con Apple (se lo scegli e quando disponibile).',
          'OpenStreetMap (mappe e ricerca dei luoghi): riceve il luogo che cerchi.',
          'Open-Meteo: riceve le coordinate del luogo per mostrare il meteo.',
          'Spotify: riceve il testo che cerchi quando associ un brano a un ricordo.',
        ]} />
        <p>
          I contenuti dei viaggi condivisi sono visibili ai membri del viaggio; quelli con
          link pubblico sono visibili a chiunque abbia il link, finché non lo disattivi.
        </p>
      </Sezione>

      <Sezione titolo="Per quanto tempo">
        <p>
          Conserviamo i dati finché mantieni l'account. Se lo elimini, cancelliamo i tuoi
          viaggi, ricordi, foto, documenti e il profilo. I viaggi condivisi con altre
          persone restano disponibili ai loro membri, e la proprietà passa a un collaboratore.
        </p>
      </Sezione>

      <Sezione titolo="I tuoi diritti">
        <p>Puoi in ogni momento, direttamente dall'app (Profilo → Impostazioni account):</p>
        <Elenco voci={[
          'modificare i tuoi dati;',
          'scaricare una copia dei tuoi dati (portabilità);',
          'eliminare l\'account e tutti i tuoi contenuti.',
        ]} />
        <p>
          Hai inoltre diritto di accesso, limitazione e opposizione al trattamento, e di
          proporre reclamo al Garante per la protezione dei dati personali (garanteprivacy.it).
          {!EMAIL_PRIVACY && ' Per esercitarli usa le funzioni nell\'app.'}
        </p>
      </Sezione>

      <Sezione titolo="Dati conservati sul dispositivo">
        <p>
          L'app salva sul tuo dispositivo solo informazioni tecniche necessarie (sessione,
          preferenze, copia dell'app per l'uso offline). Non usiamo cookie di profilazione.
        </p>
      </Sezione>

      <Sezione titolo="Modifiche">
        <p>
          Se cambieremo questa informativa aggiorneremo la data in alto e, se le modifiche
          sono rilevanti, ti avviseremo nell'app.
        </p>
      </Sezione>
    </LegalLayout>
  )
}
