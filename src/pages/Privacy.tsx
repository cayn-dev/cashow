import { Shield, Lock, Database, Eye, Trash2, Server, ArrowLeft } from 'lucide-react';
import { GlassCard } from '@/components/GlassCard';
import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';

const Privacy = () => {
  const navigate = useNavigate();

  const sections = [
    {
      icon: Lock,
      title: 'Crittografia dei dati',
      items: [
        'Tutti i dati sono crittografati a riposo con AES-256',
        'Le connessioni sono protette con TLS/SSL (HTTPS)',
        'Le password sono hashate con bcrypt e mai salvate in chiaro',
        'I token di autenticazione sono gestiti in modo sicuro',
      ],
    },
    {
      icon: Database,
      title: 'Archiviazione sicura',
      items: [
        'I dati sono archiviati in data center europei conformi GDPR',
        'Backup automatici e ridondanti per prevenire perdite di dati',
        'Isolamento completo: ogni utente accede solo ai propri dati',
        'Row Level Security (RLS) su ogni tabella del database',
      ],
    },
    {
      icon: Eye,
      title: 'Privacy e trasparenza',
      items: [
        'Non vendiamo né condividiamo i tuoi dati con terze parti',
        'Non utilizziamo i tuoi dati finanziari per profilazione pubblicitaria',
        'Nessun tracciamento invasivo: solo analytics anonimi essenziali',
        'Puoi esportare tutti i tuoi dati in qualsiasi momento',
      ],
    },
    {
      icon: Shield,
      title: 'Controllo dell\'accesso',
      items: [
        'Autenticazione sicura tramite Google, Apple o email',
        'Protezione PIN opzionale e biometria (Face ID / Touch ID)',
        'Blocco automatico dopo inattività configurabile',
        'Audit log di tutte le operazioni sul tuo account',
      ],
    },
    {
      icon: Trash2,
      title: 'I tuoi diritti',
      items: [
        'Diritto di accesso: puoi vedere tutti i tuoi dati',
        'Diritto di portabilità: esporta i dati in formato JSON',
        'Diritto all\'oblio: cancella il tuo account e tutti i dati associati',
        'Diritto di rettifica: modifica i tuoi dati in qualsiasi momento',
      ],
    },
    {
      icon: Server,
      title: 'Infrastruttura',
      items: [
        'Infrastruttura cloud sicura e monitorata 24/7',
        'Aggiornamenti di sicurezza applicati automaticamente',
        'Protezione DDoS e firewall avanzati',
        'Nessun accesso ai dati da parte del personale senza autorizzazione',
      ],
    },
  ];

  return (
    <div className="min-h-screen bg-background">
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-primary/5 rounded-full blur-[128px]" />
        <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-primary/5 rounded-full blur-[128px]" />
      </div>

      <div className="relative z-10 container max-w-3xl mx-auto py-8 px-4">
        <Button
          variant="ghost"
          onClick={() => navigate('/')}
          className="mb-6"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Torna all'app
        </Button>

        <div className="text-center mb-10">
          <div className="w-16 h-16 rounded-2xl bg-primary/20 flex items-center justify-center mx-auto mb-4">
            <Shield className="w-8 h-8 text-primary" />
          </div>
          <h1 className="font-display text-3xl font-bold mb-2">Privacy & Sicurezza</h1>
          <p className="text-muted-foreground max-w-lg mx-auto">
            La tua privacy è la nostra priorità. Ecco come proteggiamo i tuoi dati finanziari.
          </p>
        </div>

        <div className="space-y-6">
          {sections.map((section) => (
            <GlassCard key={section.title} className="p-6">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-xl bg-primary/20 flex items-center justify-center shrink-0">
                  <section.icon className="w-5 h-5 text-primary" />
                </div>
                <h2 className="font-display font-semibold text-lg">{section.title}</h2>
              </div>
              <ul className="space-y-2 ml-13">
                {section.items.map((item, i) => (
                  <li key={i} className="flex items-start gap-2 text-sm text-muted-foreground">
                    <span className="text-primary mt-0.5">✓</span>
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </GlassCard>
          ))}
        </div>

        <div className="text-center mt-10 text-sm text-muted-foreground">
          <p>Ultimo aggiornamento: Marzo 2026</p>
          <p className="mt-1">FinanceFlow v1.0.0 — I tuoi dati, la tua sicurezza.</p>
        </div>
      </div>
    </div>
  );
};

export default Privacy;
