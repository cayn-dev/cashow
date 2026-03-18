import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { 
  Wallet, TrendingUp, PiggyBank, BarChart3, Bell, Bot, 
  Shield, Smartphone, ArrowRight, Star, Zap, Globe 
} from 'lucide-react';

const features = [
  { icon: BarChart3, title: 'Grafici Intelligenti', desc: 'Visualizza entrate e uscite con grafici interattivi per categoria e periodo.' },
  { icon: PiggyBank, title: 'Obiettivi di Risparmio', desc: 'Imposta obiettivi e traccia i progressi verso i tuoi traguardi finanziari.' },
  { icon: Bell, title: 'Notifiche Smart', desc: 'Ricevi avvisi quando superi il budget o raggiungi un obiettivo.' },
  { icon: Bot, title: 'AI Assistente', desc: 'Chiedi consigli finanziari personalizzati al nostro assistente AI.' },
  { icon: Shield, title: 'Sicuro & Privato', desc: 'I tuoi dati sono protetti con crittografia end-to-end.' },
  { icon: Globe, title: 'Multi-lingua', desc: 'Disponibile in italiano, inglese, spagnolo, francese e tedesco.' },
];

const stats = [
  { value: '100%', label: 'Gratuito' },
  { value: '5', label: 'Lingue' },
  { value: '∞', label: 'Transazioni' },
  { value: '24/7', label: 'Disponibile' },
];

export default function Landing() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-background text-foreground overflow-x-hidden">
      {/* Background effects */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div className="absolute top-0 left-1/3 w-[600px] h-[600px] bg-primary/8 rounded-full blur-[180px]" />
        <div className="absolute bottom-1/4 right-1/4 w-[400px] h-[400px] bg-primary/5 rounded-full blur-[150px]" />
      </div>

      {/* Nav */}
      <nav className="relative z-20 flex items-center justify-between px-6 py-4 max-w-6xl mx-auto">
        <div className="flex items-center gap-2">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-primary to-primary/70 flex items-center justify-center">
            <Wallet className="w-5 h-5 text-primary-foreground" />
          </div>
          <span className="font-bold text-lg">FinanceFlow</span>
        </div>
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="sm" onClick={() => navigate('/auth')}>
            Accedi
          </Button>
          <Button size="sm" onClick={() => navigate('/auth')}>
            Inizia Gratis <ArrowRight className="w-4 h-4 ml-1" />
          </Button>
        </div>
      </nav>

      {/* Hero */}
      <section className="relative z-10 max-w-6xl mx-auto px-6 pt-16 pb-20 text-center">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7 }}
        >
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-primary/30 bg-primary/10 text-primary text-sm font-medium mb-8">
            <Zap className="w-3.5 h-3.5" />
            100% Gratuito — Nessuna carta richiesta
          </div>
          
          <h1 className="text-4xl sm:text-5xl md:text-6xl font-bold leading-tight mb-6">
            Le tue finanze,{' '}
            <span className="bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent">
              sotto controllo.
            </span>
          </h1>
          
          <p className="text-lg sm:text-xl text-muted-foreground max-w-2xl mx-auto mb-10">
            Traccia spese, monitora risparmi e raggiungi i tuoi obiettivi finanziari 
            con un'app elegante e intelligente.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Button size="lg" className="text-base px-8" onClick={() => navigate('/auth')}>
              Crea Account Gratuito <ArrowRight className="w-5 h-5 ml-2" />
            </Button>
            <Button size="lg" variant="outline" className="text-base px-8" onClick={() => navigate('/auth')}>
              Prova senza account
            </Button>
          </div>
        </motion.div>

        {/* Stats */}
        <motion.div 
          className="grid grid-cols-2 sm:grid-cols-4 gap-6 mt-20 max-w-2xl mx-auto"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.3 }}
        >
          {stats.map((stat) => (
            <div key={stat.label} className="text-center">
              <div className="text-2xl sm:text-3xl font-bold text-primary">{stat.value}</div>
              <div className="text-sm text-muted-foreground mt-1">{stat.label}</div>
            </div>
          ))}
        </motion.div>
      </section>

      {/* Features */}
      <section className="relative z-10 max-w-6xl mx-auto px-6 py-20">
        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          className="text-center mb-16"
        >
          <h2 className="text-3xl sm:text-4xl font-bold mb-4">Tutto ciò che ti serve</h2>
          <p className="text-muted-foreground text-lg max-w-xl mx-auto">
            Funzionalità potenti in un'interfaccia semplice e moderna.
          </p>
        </motion.div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {features.map((feature, i) => (
            <motion.div
              key={feature.title}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.1 }}
              className="group p-6 rounded-2xl border border-border/50 bg-card backdrop-blur-sm hover:border-primary/30 transition-all duration-300"
            >
              <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center mb-4 group-hover:bg-primary/20 transition-colors">
                <feature.icon className="w-6 h-6 text-primary" />
              </div>
              <h3 className="font-semibold text-lg mb-2">{feature.title}</h3>
              <p className="text-muted-foreground text-sm leading-relaxed">{feature.desc}</p>
            </motion.div>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section className="relative z-10 max-w-4xl mx-auto px-6 py-20 text-center">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          whileInView={{ opacity: 1, scale: 1 }}
          viewport={{ once: true }}
          className="p-10 sm:p-16 rounded-3xl border border-primary/20 bg-gradient-to-br from-primary/10 to-primary/5"
        >
          <Star className="w-10 h-10 text-primary mx-auto mb-6" />
          <h2 className="text-3xl sm:text-4xl font-bold mb-4">
            Prendi il controllo delle tue finanze oggi
          </h2>
          <p className="text-muted-foreground text-lg mb-8 max-w-lg mx-auto">
            Unisciti a chi ha già scelto FinanceFlow per gestire il proprio denaro in modo smart.
          </p>
          <Button size="lg" className="text-base px-10" onClick={() => navigate('/auth')}>
            Inizia Ora — È Gratis <ArrowRight className="w-5 h-5 ml-2" />
          </Button>
        </motion.div>
      </section>

      {/* Footer */}
      <footer className="relative z-10 border-t border-border/50 py-8 px-6">
        <div className="max-w-6xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Wallet className="w-4 h-4" />
            <span>© 2026 FinanceFlow. Tutti i diritti riservati.</span>
          </div>
          <div className="flex items-center gap-6 text-sm">
            <a href="/privacy" className="text-muted-foreground hover:text-foreground transition-colors">Privacy</a>
            <a href="/auth" className="text-muted-foreground hover:text-foreground transition-colors">Accedi</a>
          </div>
        </div>
      </footer>
    </div>
  );
}