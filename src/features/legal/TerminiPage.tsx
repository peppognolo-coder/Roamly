import { LegalLayout, Sezione, Elenco } from './LegalLayout'
import { EMAIL_PRIVACY } from '@/lib/legal'

export function TerminiPage() {
  return (
    <LegalLayout titolo="Termini di servizio">
      <Sezione titolo="Cos'è Roamly">
        <p>
          Roamly è un'app per pianificare, raccontare e conservare i tuoi viaggi. Usandola
          accetti questi termini. Se non li accetti, non usare l'app.
        </p>
      </Sezione>

      <Sezione titolo="Il tuo account">
        <p>
          Sei responsabile di mantenere riservate le tue credenziali e di ciò che avviene
          con il tuo account. Fornisci informazioni veritiere e tieni aggiornata la tua email.
        </p>
      </Sezione>

      <Sezione titolo="I tuoi contenuti">
        <p>
          Foto, testi, documenti e tutto ciò che carichi restano tuoi. Ci autorizzi solo a
          conservarli e mostrarli per far funzionare l'app, anche alle persone con cui scegli
          di condividerli. Carica solo contenuti che hai il diritto di usare e, se ritraggono
          altre persone, condividili con rispetto.
        </p>
      </Sezione>

      <Sezione titolo="Cosa non è consentito">
        <Elenco voci={[
          'caricare contenuti illegali, offensivi, che violano diritti altrui o la privacy di terzi;',
          'usare l\'app per spam, molestie o per danneggiare altri utenti;',
          'tentare di accedere ai dati di altri, aggirare i limiti tecnici o sovraccaricare il servizio.',
        ]} />
        <p>In caso di violazioni possiamo rimuovere contenuti o sospendere l'account.</p>
      </Sezione>

      <Sezione titolo="Viaggi condivisi">
        <p>
          Nei viaggi condivisi i contenuti sono visibili ai membri. Chi crea un link pubblico
          rende il viaggio visibile a chiunque lo riceva e può disattivarlo quando vuole.
        </p>
      </Sezione>

      <Sezione titolo="Disponibilità del servizio">
        <p>
          Roamly è offerta così com'è. Facciamo il possibile perché funzioni bene e i tuoi
          dati siano al sicuro, ma non possiamo garantire assenza di interruzioni o errori.
          Ti consigliamo di scaricare ogni tanto una copia dei tuoi dati (Profilo →
          Impostazioni account → Scarica i miei dati). Le informazioni di viaggio inserite
          (orari, prenotazioni, meteo) sono un supporto: verifica sempre le fonti ufficiali.
        </p>
      </Sezione>

      <Sezione titolo="Chiusura dell'account">
        <p>
          Puoi eliminare il tuo account in qualsiasi momento dalle impostazioni: i tuoi
          contenuti vengono cancellati in modo definitivo. Possiamo sospendere o chiudere
          account che violano questi termini.
        </p>
      </Sezione>

      <Sezione titolo="Modifiche e legge applicabile">
        <p>
          Potremo aggiornare questi termini; la data in alto indica l'ultima versione. Si
          applica la legge italiana.
          {EMAIL_PRIVACY && <> Per domande: <a className="underline" href={`mailto:${EMAIL_PRIVACY}`}>{EMAIL_PRIVACY}</a>.</>}
        </p>
      </Sezione>
    </LegalLayout>
  )
}
